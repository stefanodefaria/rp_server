/**
 * Created by St�fano on 06/04/2015.
 */

const returnMessage = {
    SUCCESS: 'SUCCESS',                             //Operation successful
    BAD_CREDENTIALS: 'BAD_CREDENTIALS',             //Incorrect email or password
    SESSION_TIMED_OUT: 'SESSION_TIMED_OUT',         //It's passed more than 'timeout' since last request
    BAD_OPERATION: 'BAD_OPERATION',                 //Invalid operation (ie path)
    BAD_DATA: 'BAD_DATA',                           //Corrupt data provided by client
    SERVER_ERROR: 'SERVER_ERROR',                   //Internal unexpected server error
    EMAIL_NOT_UNIQUE: 'EMAIL_NOT_UNIQUE',           //Email already used, when trying to register
    MISSING_DATA: 'MISSING_DATA',                   //Missing parameter data (ie email, password, username)
    DEVICE_BUSY: 'DEVICE_BUSY'                      //Requested device is not available
};

const deviceStatus = {
    UNINITIALIZED: 'UNINITIALIZED',
    UNSTARTED: 'UNSTARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED',
    UNKNOWN: 'UNKNOWN'
};

const profileType = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'      //not in use
};

const osType = {
    WINDOWS: 'Windows_NT',
    LINUX: 'Linux',
    OS_X: 'Darwin'
};

module.exports.returnMessage = returnMessage;
module.exports.profileType = profileType;
module.exports.deviceStatus = deviceStatus;
module.exports.osType = osType;
