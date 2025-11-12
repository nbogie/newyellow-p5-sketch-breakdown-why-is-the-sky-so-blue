//All that's needed for global mode
//IF we're not referring to the p5 types in JSDoc comments
import * as p5Global from "p5/global";

//Needed for instance mode and referring to the
//types (e.g. in jsdoc comments, even in global mode)
import module from "p5";
export = module;
export as namespace p5;
