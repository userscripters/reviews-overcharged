import browserify from "browserify";
import type GulpClient from "gulp";
import { dest, src } from "gulp";
import ts from "gulp-typescript";
import ug from "gulp-uglify";

const project = ts.createProject("./tsconfig.json");

export const build: GulpClient.TaskFunction = () => {
  return src("src/*.ts")
    .pipe(project())
    .pipe(ug({ output: { webkit: true } }))
    .pipe(dest("dist"))
    .on("end", () => {
      const bobj = browserify({
        entries: "dist/main.js",
      });
      return bobj.bundle();
    });
};
