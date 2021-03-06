var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var auth = jwt({
	secret: process.env.JWT_SECRET,
	userProperty: 'payload'
});

var ctrlAuth = require('../controllers/auth');
var ctrlDataset = require('../controllers/datasets');
var ctrlFile = require('../controllers/files');
var ctrlS3 = require('../controllers/s3');
var ctrlAnalysis = require('../controllers/analysis');
var ctrlUsers = require('../controllers/users');
var ctrlSurveys = require('../controllers/surveys');
var ctrlSettings = require('../controllers/settings');
var ctrlMap = require('../controllers/map');

/* Middleware to check the connection status of the database. For any request that involves */
/* the database, add this function to the request parameters to check the connection status. */
/* if 'connected' the request will conintue, otherwise it will responds with an error. */
function checkDatabaseStatus(req, res, next) {
	if(mongoose.connection.readyState === 1) {	/* connected = 1 */
		next();
	} else {
		res.status(500);
		res.json({errmsg: "Database connection error."});
	}
}

/* ==================== Authentication ==================== */
router.post('/register', checkDatabaseStatus, ctrlAuth.register);
router.post('/login', checkDatabaseStatus, ctrlAuth.login);
router.post('/password/forgot', checkDatabaseStatus, ctrlAuth.forgotPassword);
router.post('/password/reset', checkDatabaseStatus, ctrlAuth.resetPassword);

/* System Settings [User Settings are part of Users data/controller] */
router.get('/settings', auth, checkDatabaseStatus, ctrlSettings.getSettings);
router.put('/settings', auth, checkDatabaseStatus, ctrlSettings.setSettings);

/* Users */
router.post('/user', auth, checkDatabaseStatus, ctrlUsers.createUser);
router.get('/user/info', auth, checkDatabaseStatus, ctrlUsers.getUserInfo);
router.get('/users/info', auth, checkDatabaseStatus, ctrlUsers.getAllUsersInfo);			/* Gets all users info */
router.get('/user/last-modified', auth, checkDatabaseStatus, ctrlUsers.userLastModified);	/* Get the date the user's info was last modified */
router.get('/user/avatar/:email', checkDatabaseStatus, ctrlUsers.getAvatar);				/* Get the avatar for the email address for the login page */
router.put('/user/:email?', auth, checkDatabaseStatus, ctrlUsers.updateProfile);			/* Update a user's details */
router.delete('/user/:email', auth, checkDatabaseStatus, ctrlUsers.deleteUser);				/* Delete a User's account */
/* router.get('/user/:email', auth, checkDatabaseStatus, ctrlUsers.getUserProfile); */		/* View a user's profile - Not sure if this is still needed? Is interfering with the route below (/user/last-modified) */

/* Datasets */
router.post('/analysis/data/create', auth, checkDatabaseStatus, ctrlDataset.datasetCreate);
router.get('/analysis/data/list', auth, checkDatabaseStatus, ctrlDataset.listDatasets);
router.get('/analysis/data/read/:datasetid', auth, checkDatabaseStatus, ctrlDataset.datasetReadOne);
router.delete('/analysis/data/delete', auth, checkDatabaseStatus, ctrlDataset.deleteDatasetDB);

/* File operations - download link, get info, update/upload, delete */
router.get('/files/:filepath(*)/download', auth, checkDatabaseStatus, ctrlS3.signDownload); //TODO
router.get('/files/:filepath(*)', auth, checkDatabaseStatus, ctrlFile.getFile);
router.put('/files/:filepath(*)', auth, checkDatabaseStatus, ctrlFile.putFile);
router.delete('/files/:filepath(*)', auth, checkDatabaseStatus, ctrlFile.deleteFile);
router.post('/files/acl', auth, checkDatabaseStatus, ctrlFile.acl);

/* Tag and criteria search of the file system */
router.get('/files/?tags=:tags', auth, checkDatabaseStatus, ctrlUsers.getUserProfile);
router.get('/files/?search=:query', auth, checkDatabaseStatus, ctrlUsers.getUserProfile);

/* Get (limited) file info for pins on the map based on some criteria. Ie. Limited in spatial or time range */
router.get('/map', auth, checkDatabaseStatus, ctrlFile.map);

/* S3 operations */
router.post('/s3/signUpload', auth, checkDatabaseStatus, ctrlS3.signUpload);
router.get('/s3/signDownload/:key(*)', auth, checkDatabaseStatus, ctrlS3.signDownloadKey);
router.get('/s3/list', auth, ctrlS3.getFileList);
router.delete('/s3/:key(*)', auth, checkDatabaseStatus, ctrlS3.deleteFile);
router.post('/s3/syncDB', auth, checkDatabaseStatus, ctrlS3.syncDB);
router.post('/s3/acl', auth, checkDatabaseStatus, ctrlS3.acl);

/* ==================== Analysis ==================== */
router.post('/analysis/watson', auth, checkDatabaseStatus, ctrlAnalysis.watsonAnalysis);
router.post('/analysis/watsonText', auth, checkDatabaseStatus, ctrlAnalysis.watsonTextAnalysis);
router.get('/analysis/watson/read/:id', auth, checkDatabaseStatus, ctrlAnalysis.readWatsonAnalysis);
router.get('/analysis/watson/read/:id/categories', auth, checkDatabaseStatus, ctrlAnalysis.readWatsonCategories);
router.get('/analysis/watson/list', auth, checkDatabaseStatus, ctrlAnalysis.listWatsonAnalysis);
router.delete('/analysis/watson/:id', auth, checkDatabaseStatus, ctrlAnalysis.deleteWatsonAnalysis);

/* Surveys */
router.post('/survey/save', checkDatabaseStatus, ctrlSurveys.saveSurvey);
router.get('/survey/check', checkDatabaseStatus, ctrlSurveys.checkSurvey);
router.get('/survey/read', auth, checkDatabaseStatus, ctrlSurveys.readSurvey);
router.get('/survey/read/json/:accessId', checkDatabaseStatus, ctrlSurveys.readSurveyJSON);
router.get('/survey/list', auth, checkDatabaseStatus, ctrlSurveys.listSurveys);
router.delete('/survey/delete', auth, checkDatabaseStatus, ctrlSurveys.deleteSurvey);
router.post('/survey/response/save/:responseId?', checkDatabaseStatus, ctrlSurveys.saveSurveyResponse); //Post a survery reponse or, with a responeId, update one.
router.get('/survey/:accessId/response/:responseId', auth, checkDatabaseStatus, ctrlSurveys.readOneSurveyResponse);
router.get('/survey/responses/read', auth, checkDatabaseStatus, ctrlSurveys.readSurveyResponses);

/* Map Marker Link */
router.put('/map/link', auth, checkDatabaseStatus, ctrlMap.putLink);
router.get('/map/link', auth, checkDatabaseStatus, ctrlMap.getLinks);
router.delete('/map/link/:id', auth, checkDatabaseStatus, ctrlMap.deleteLink);

module.exports = router;