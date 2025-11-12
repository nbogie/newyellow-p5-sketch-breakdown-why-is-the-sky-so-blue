import { getCircleQueue, getCircleWalkPath, getNoisePath } from "./path.js";

/**
 * @typedef {import("./path.js").PointPath} PointPath
 */

/**
 *
 * @param {number} padding
 * @param {{showPath:boolean, showCircles:boolean, breakWhenPossible:boolean}} config
 * @returns {Promise<{paths: PointPath[], cloudPaths: PointPath[]}>}
 */
export async function makeCloudPaths(padding, config) {
    const paths = [];
    const cloudPaths = [];
    let pathCount = floor(random(6, 20));
    let pathDist = (height * 0.6) / pathCount;

    for (let i = 0; i < pathCount; i++) {
        let x1 = -padding;
        let y1 = 0.4 * height + i * pathDist;

        let x2 = width + padding;
        let y2 = y1;

        let pathNoise = random(0.001, 0.003);
        let pathHeight = random(0.1, 0.4) * height;
        paths[i] = await getNoisePath(
            x1,
            y1,
            x2,
            y2,
            pathNoise,
            pathHeight,
            config
        );
    }

    // get cloud paths into cloudPaths[]
    for (let i = 0; i < paths.length; i++) {
        if (config.breakWhenPossible) {
            break;
        }
        let lv1Circles = await getCircleQueue(paths[i], 30, 240, config);
        let lv1Path = await getCircleWalkPath(lv1Circles, 1, config);

        let lv2Circles = await getCircleQueue(lv1Path, 10, 60, config);
        cloudPaths[i] = await getCircleWalkPath(lv2Circles, 1, config);
    }
    return { paths, cloudPaths };
}
