/**
 * Created by stefano on 29/08/15.
 */

var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var utils = require('./utils');
var defs = require('./definitions');

var startupDelay = 500; //ms, delay to wait for possible error during startup

var baseOutputPath = './camera_output',
    videoFileName = 'output.avi',
    snapshotDirPath = 'snapshots',
    snapshotFileName = 'out',
    snapshotFileExtension = '.jpg';

if(!fs.existsSync(baseOutputPath)){
    try{
        fs.mkdirSync(baseOutputPath);
    }
    catch(err){
        utils.catchErr(err);
    }
}


/**
 *
 * @param opts - opts.cameraPath is mandatory
 * @returns {{startRecording: Function, getStatus: Function, getSnapshot: Function, getVideo: Function, flushSnapshots: Function}}
 */
function expRecorder(opts){

    if(!opts || !opts.cameraPath){
        var err = new Error('Missing options' + ((opts && !opts.cameraPath)? ': cameraPath' : ''));
        err.type = 'RecorderError';
        throw err;
    }

    var path = opts.path || 'default_path',
        recTimeOption = (opts.recTime)? '-t ' + opts.recTime: null,
        cameraPath = opts.cameraPath,
        fps = opts.fps || 30,
        size = opts.size || '640x480',
        bitRate = opts.bitRate || 1000,
        snapshotFrequency = opts.snapshotFrequency || 3; //hertz;

    var outputDirPath = baseOutputPath + '/' + path;
    var firstSnapshotReadTime = Date.now();

    var error = null,
        started = false,
        stoping = false,
        finished = false;

    var ffmpegProcess;
    var onEndCallback;

    try{
        utils.deleteFolderRecursive(outputDirPath);
        fs.mkdirSync(outputDirPath);
        fs.mkdirSync(outputDirPath + '/' + snapshotDirPath);
    }
    catch(err){
        utils.catchErr(err);
    }

    return {
        startRecording: function(callback){

            ffmpegProcess =  ffmpeg(cameraPath);

            //adds input format 'dshow' for Windows
            if(utils.getOSType() === defs.osType.WINDOWS){
                ffmpegProcess.inputOption('-f dshow');
            }
            if(recTimeOption){
                ffmpegProcess.inputOption(recTimeOption);
            }

            ffmpegProcess.output(outputDirPath + '/' + videoFileName)
                .size(size)
                .videoBitrate(bitRate)
                .output(outputDirPath + '/' + snapshotDirPath + '/' +snapshotFileName + '%d' + snapshotFileExtension)
                .size(size)
                .outputOptions([
                    '-vf fps=' + snapshotFrequency
                ]);

                ffmpegProcess.on('start', onStart)
                .on('error', onError)
                .on('end', onEnd)
                .run();

            function onStart(cmd){
                console.log('Executing: ', cmd);

                // delay to wait for possible error during startup
                setTimeout(function(){
                    if(!finished){ // could be finished in case of error before this timeout
                        started = true;
                        //console.log('Started recording with ' + cameraPath, ' - Output files will be saved on ' + outputDirPath);
                        console.log('Started recording successfully');
                        return callback(null);
                    }
                }, startupDelay);
            }

            function onError(err){
                console.log('ERROR recording with ' + cameraPath);
                error = err;
                finished = true;

                if(!started){ //could be called before actually started
                    return callback(err);
                }
                utils.catchErr(err);
            }

            function onEnd(){
                console.log('Finished recording with ' + cameraPath);
                finished = true;
                if(onEndCallback){
                    onEndCallback();
                }
            }
        },
        stopRecording: function(){
            ffmpegProcess.on('progress', function(progress){
                if(stoping){ return; } //prevents calling stdin.write('q') more than once
                console.log("Stopping recording with " + cameraPath + " at " + progress.timemark);
                stoping = true;
                ffmpegProcess.ffmpegProc.stdin.write('q');
                //ffmpegProcess..kill('SIGTERM'); //sends termination signal
            })
        },
        onEnd: function(cb){
            onEndCallback = cb;
        },
        getStatus: function(){
            return {finished: finished, error: error};
        },
        /**
         * @param count (snapshot index, starting from 1)
         * @param cb(err, data)
         *          if 'err' and 'data' are undefined, means file is not ready yet
         */
        getSnapshot: function(count, cb){
            var snapshotPath = outputDirPath + '/' + snapshotDirPath + '/' + snapshotFileName + count + snapshotFileExtension;

            if(!started || error || finished){
                return cb();
            }

            fs.exists(snapshotPath, function(exists){
                if(!exists){
                    return cb();
                }

                fs.readFile(snapshotPath, function(err, data){
                    if(err){
                        return cb(err);
                    }
                    return cb(null, data);
                });
            })

        },
        /**
         * @param count (snapshot index, starting from 1)
         * @param cb(err, data)
         *          if 'err' and 'data' are undefined, means file is not ready yet
         */
        getNextSnapshot: function(count, cb){
            var snapshotPath = outputDirPath + '/' + snapshotDirPath + '/' + snapshotFileName + count + snapshotFileExtension;

            if(!started || error  || (firstSnapshotReadTime  + (1/snapshotFrequency) * 1000 * count) > Date.now()){
                return cb();
            }

            fs.exists(snapshotPath, function(exists){
                if(!exists){
                    return cb();
                }
                fs.readFile(snapshotPath, function(err, data){
                    if(err){
                        return cb(err);
                    }
                    return cb(null, data);
                });
            })

        },
        /**
         * @param cb(err, data)
         *          if 'err' and 'data' are undefined, means file is not ready yet
         */
        getVideo: function(cb){

            if(!finished || error){
                return cb();
            }

            fs.exists(outputDirPath + '/' + videoFileName, function(exists){
                if(!exists){
                    return cb();
                }

                fs.readFile(outputDirPath + '/' + videoFileName, function(err, data){
                    if(err){
                        return cb(err);
                    }
                    firstSnapshotReadTime = Date.now();
                    return cb(null, data);
                });
            })
        },
        flushSnapshots: function(){
            utils.deleteFolderRecursive(outputDirPath + '/' + snapshotDirPath);
        }
    }
}

module.exports = expRecorder;
module.exports.baseOutputPath = baseOutputPath;
module.exports.videoFileName = videoFileName;

/**
 * SOMENTE PARA TESTES
 * @type {{path: string, recTime: number, fps: number, bitRate: number, snapshotFrequency: number}}
 */

//var recOpts = {
//    path: 'test@test.com_gravity',
//    cameraPath: '/dev/video0',
//    fps: 30,
//    bitRate: 1000,
//    snapshotFrequency: 3
//};
//
//var recorder = expRecorder(recOpts);
//
//recorder.startRecording(function(err, msg){
//    console.log(msg);
//    var intervalID = setInterval(function(){
//        console.log(recorder.getStatus().finished);
//        if(recorder.getStatus().finished){
//            clearInterval(intervalID);
//
//            recorder.flushSnapshots();
//            //recorder.getVideo();
//            return;
//        }
//
//        recorder.stopRecording();
//
//        //recorder.getSnapshot(1, function(stream){
//        //    console.log(stream)
//        //});
//
//
//    }, 333);
//});
//
