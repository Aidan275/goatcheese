/**
* @author Aidan Andrews
* @email aa275@uowmail.edu.au
* @ngdoc service
* @name services.service:s3Service
* @description Service used for making requests to the
* server to handle s3 functions.
*/


(function () {

	'use strict';

	angular
	.module('services')
	.service('s3Service', s3Service);

	/* @ngInject */
	function s3Service($http, authService, exception) {
		return {
			signUpload		: signUpload,
			signDownload	: signDownload,
			signDownloadKey	: signDownloadKey,
			deleteFile 		: deleteFile,
			getFileList 	: getFileList,
			updateACL 		: updateACL
		};

		///////////////////////////

		function signUpload(query){
			return $http.post('/api/s3/signUpload', query, {
				headers: {
					Authorization: 'Bearer ' + authService.getToken()
				}
			}).then(signUploadComplete)
			.catch(signUploadFailed);

			function signUploadComplete(data) { return data.data; }
			function signUploadFailed(e) { return exception.catcher('Failed signing the S3 upload URL.')(e); }
		};

		function signDownload(filePath, fileName, getTextFile){
			/* Encode the key for the API URL in case it includes reserved characters (e.g '+', '&') */
			/* var encodedKey = encodeURIComponent(key); */
			if(!getTextFile){
				getTextFile = 'false';
			}

			if (filePath == '/') {
				var url = '/api/files/' + fileName + '/download?getTextFile=' + getTextFile; /* If getTextFile=true, returns the associated text file for analysis */
			} else {
				var url = '/api/files/' + filePath + '/' + fileName + '/download?getTextFile=' + getTextFile; /* If getTextFile=true, returns the associated text file for analysis */ 
			}

			return $http.get(url, {
				headers: {
					Authorization: 'Bearer ' + authService.getToken()
				}
			}).then(signDownloadComplete)
			.catch(signDownloadFailed);

			function signDownloadComplete(data) { return data.data; }
			function signDownloadFailed(e) { return exception.catcher('Failed signing the S3 download URL.')(e); }
		};


		function signDownloadKey(key){
			return $http.get('/api/s3/signDownload/' + key, {
				headers: {
					Authorization: 'Bearer ' + authService.getToken()
				}
			}).then(signDownloadKeyComplete)
			.catch(signDownloadKeyFailed);

			function signDownloadKeyComplete(data) { return data.data; }
			function signDownloadKeyFailed(e) { return exception.catcher('Failed signing the S3 download URL.')(e); }
		};

		function deleteFile(key){
			return $http.delete('/api/s3/' + key, {
				headers: {
					Authorization: 'Bearer ' + authService.getToken()
				}
			}).then(deleteFileComplete)
			.catch(deleteFileFailed);

			function deleteFileComplete(data) { return data.data; }
			function deleteFileFailed(e) { return exception.catcher('Failed deleting the file from S3.')(e); }
		};

		function getFileList(){
			return $http.get('/api/s3/list', {
				headers: {
					Authorization: 'Bearer ' + authService.getToken()
				}
			}).then(getFileListComplete)
			.catch(getFileListFailed);

			function getFileListComplete(data) { return data.data; }
			function getFileListFailed(e) { return exception.catcher('Failed listing the files from S3.')(e); }
		};

		function updateACL(aclObject) {
			return $http.post('/api/s3/acl', aclObject, {
				headers: {
					Authorization: 'Bearer '+ authService.getToken()
				}
			}).then(updateACLComplete)
			.catch(updateACLFailed);

			function updateACLComplete(data) { return data.data; }
			function updateACLFailed(e) { return exception.catcher('Failed updating the file\'s S3 permissions.')(e); }
		}
	}

})();