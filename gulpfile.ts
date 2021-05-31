import * as browserify from "browserify";
import * as del from "del";
import * as GulpClient from "gulp";
import { dest, src } from "gulp";
import * as ts from "gulp-typescript";
import * as ug from "gulp-uglify";
import * as buffer from "vinyl-buffer";
import * as source from "vinyl-source-stream";

const project = ts.createProject("./src/tsconfig.json");

export const build: GulpClient.TaskFunction = async () => {
    const transforming = new Promise((resolve, reject) => {
        return src("src/*.ts")
            .pipe(project())
            .pipe(dest("dist"))
            .on("error", reject)
            .on("end", resolve);
    });

    await transforming;

    const entryPath = "dist/main.js";

    const bobj = browserify({
        entries: entryPath,
    });

    const bundling = new Promise((resolve, reject) => {
        bobj.bundle()
            .pipe(source(entryPath))
            .pipe(buffer())
            .pipe(
                ug({ output: { webkit: true }, mangle: { keep_fnames: true } })
            )
            .pipe(dest(".", { overwrite: true }))
            .on("error", reject)
            .on("end", resolve);
    });

    await bundling;

    del(["dist/**/*", "!dist/main.js"]);
};
