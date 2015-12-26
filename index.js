/**
 * @pre-combo
 * @author maquan
 * @description 根据配置文件拼接成完整的URL
 */
'use strict';

var through = require('through2');
var path = require('path');


module.exports = function (repoinfo) {

	return through.obj(function (file, enc, cb) {

		var pathArr = file.path.split('/');
		pathArr.pop();
		var thisPath = pathArr.join('/') + '/',
			chunk = String(file.contents);

		/**
		 * 处理后缀和相对路经
		 * @param  {string} p 文件名==>like index.js
		 * @return {string}   路径名==>line HFE/generator-test/0.1.0/pages/abc/index.js
		 */
		function handlePath(p) {
			p = path.join(thisPath, addSuffix(p));
			var projectname = file.cwd.split('/').pop(),
				relative = p.replace(file.base, ''),
				version = repoinfo.version,
				group = repoinfo.group;
			return repoinfo.url + '/' + group + '/' + projectname + '/' + version + '/' + relative;
		}

		/**
		 * 处理文件名:index.js ==> index.min.js
		 */
		function addSuffix(p) {
			var pAr = p.split('.'),
				suffix = pAr.pop();
			// return pAr.join('.') + '.min.' + suffix;
			return pAr.join('.') + '.' + suffix;
		}
		// var commentMarker = 'unUseComboMaker';
		// var regStart = new RegExp('<!--\\s*' + commentMarker + '\\s*-->');
		// var regEnd = new RegExp('(?:<!--\\s*)*\\/' + commentMarker + '\\s*-->');
		var lines = chunk.replace(/\r\n/g, '\n').split(/\n/);
		var inside = false;
		var newChunk = [];
		lines.forEach(function (line) {
			// var build = regStart.test(line);
			// var endbuild = regEnd.test(line);
			// if (build) {
			// 	inside = true;
			// }
			// if (endbuild) {
			// 	inside = false;
			// }

			if (!(line.match('data-ignore="true"') || line.match('data-ignore=\'true\''))) {
				line = line.replace(/<script[^>]+?src="([^"]+)"[^>]*><\/script>/igm, function ($, $1) {
					if ($1.indexOf('http://') > -1) {
						var finalPath = $1;
					} else {
						var finalPath = handlePath($1);
					}
					return '<script src=\"' + finalPath + '\"></script>';
				});

				line = line.replace(/<link[^>]+?href="([^"]+?)"[^>]+?rel="stylesheet"[^>]*>/igm, function ($, $1) {
					if ($1.indexOf('http://') > -1) {
						var finalPath = $1;
					} else {
						var finalPath = handlePath($1);
					}
					return '<link href=\"' + finalPath + '\" rel="stylesheet">';
				});

				line = line.replace(/<link[^>]+?rel="stylesheet"[^>]+?href="([^"]+?)"[^>]*>/igm, function ($, $1) {
					if ($1.indexOf('http://') > -1) {
						var finalPath = $1;
					} else {
						var finalPath = handlePath($1);
					}
					return '<link rel="stylesheet" href=\"' + finalPath + '\">';
				});
			}
			newChunk.push(line)
		});

		var chunk = newChunk.join('\n');
		file.contents = new Buffer(chunk);

		cb(null, file);
	});
};
