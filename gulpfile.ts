import browserify from "browserify";
// import del from "del";
import * as GulpClient from "gulp";
import { dest } from "gulp";
import ug from "gulp-uglify";
import tsify from "tsify";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";

const bundleJavaScript = (bundlePath: string) => {
    const bobj = browserify({
        entries: ["src/index.ts"]
    });

    return new Promise((resolve, reject) => {
        bobj
            .plugin(tsify, { project: "./src/tsconfig.json" })
            .bundle()
            .pipe(source(bundlePath))
            .pipe(buffer())
            .pipe(
                ug({ output: { webkit: true }, mangle: { keep_fnames: true } })
            )
            .pipe(dest(".", { overwrite: true }))
            .on("error", reject)
            .on("end", resolve);
    });
};

export const build: GulpClient.TaskFunction = async () => {
    const entryPath = "./dist/index.user.js";

    await bundleJavaScript(entryPath);

    // del(["./dist/**/*", `!${entryPath}`]);
};
