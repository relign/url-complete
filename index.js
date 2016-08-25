/**
 * @url-complete
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
        var thisPath = pathArr.join('/') + '/';
        var chunk = String(file.contents);

        /**
         * 处理后缀和相对路经
         * @param  {string} p 文件名==>like index.js
         * @return {string}   路径名==>line HFE/generator-test/0.1.0/pages/abc/index.js
         */
        function handlePath(p) {
            if (p.indexOf('/') === 0) {
                p = path.normalize(file.base + p);
            } else {
                p = path.join(thisPath, p);
            }
            var projectname = file.cwd.split('/').pop(),
                relative = p.replace(file.base, ''),
                version = repoinfo.version,
                group = repoinfo.group;
            return repoinfo.url + '/' + group + '/' + projectname + '/' + version + '/' + relative;
        }

        var lines = chunk.replace(/\r\n/g, '\n').split(/\n/);
        var newChunk = [];

        lines.forEach(function (line) {
            if (!(line.match('data-ignore="true"') || line.match('data-ignore=\'true\''))) {
                line = line.replace(/<script[^>]+?src="([^"]+)"[^>]*><\/script>/igm, function ($, $1) {
                    var finalPath;
                    if ($1.indexOf('http://') > -1) {
                        finalPath = $1;
                    } else {
                        finalPath = handlePath($1);
                    }
                    return String($).replace(String($1), finalPath);
                });

                line = line.replace(/<link[^>]+?href="([^"]+?)"[^>]+?rel="stylesheet"[^>]*>/igm, function ($, $1) {
                    var finalPath;
                    if ($1.indexOf('http://') > -1) {
                        finalPath = $1;
                    } else {
                        finalPath = handlePath($1);
                    }
                    return '<link href=\"' + finalPath + '\" rel="stylesheet">';
                });

                line = line.replace(/<link[^>]+?rel="stylesheet"[^>]+?href="([^"]+?)"[^>]*>/igm, function ($, $1) {
                    var finalPath;
                    if ($1.indexOf('http://') > -1) {
                        finalPath = $1;
                    } else {
                        finalPath = handlePath($1);
                    }
                    return '<link rel="stylesheet" href=\"' + finalPath + '\">';
                });
            }

            newChunk.push(line);

        });

        var nc = newChunk.join('\n');
        file.contents = new Buffer(nc);

        cb(null, file);
    });
};
