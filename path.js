import { sleep } from "./animUtils.js";
import { CircleData, getAngle } from "./CircleData.js";

/**
 * @typedef {{x:number, y:number}[]} PointPath
 */

/**
 *
 * @param {number} padding
 * @param {{showPath:boolean, showCircles:boolean, showCircleWalkPath:boolean, breakWhenPossible:boolean, layerCount:number}} config
 * @returns {Promise<{paths: PointPath[], cloudPaths: PointPath[]}>}
 */
export async function makeCloudPaths(padding, config) {
    const paths = [];
    const cloudPaths = [];
    const pathCount =
        config.layerCount > 0 ? config.layerCount : floor(random(6, 20));
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

// get circles on the path
/**
 *
 * @param {PointPath} _pathPoints
 * @param {number} _minSize
 * @param {number} _maxSize
 * @param {{breakWhenPossible:boolean, showPath:boolean, showCircles:boolean}} config
 * @returns {Promise<CircleData[]>}
 */
export async function getCircleQueue(
    _pathPoints,
    _minSize = 10,
    _maxSize = 60,
    config
) {
    let resultCircles = [];

    let pathIndex = 0;
    let lastPoint = _pathPoints[0];
    let nextPoint = _pathPoints[1];

    // prepare next circle
    let lastCircleSize = random(_minSize, _maxSize);
    let nextCircleSize = random(_minSize, _maxSize);
    let maxDist = lastCircleSize + nextCircleSize;
    let minDist = max(lastCircleSize, nextCircleSize);
    let nextCircleDist = lerp(minDist, maxDist, random(0.1, 0.9));

    // add in first circle
    let nowX = _pathPoints[0].x;
    let nowY = _pathPoints[0].y;

    let fromX = _pathPoints[0].x;
    let fromY = _pathPoints[0].y;

    let toX = _pathPoints[1].x;
    let toY = _pathPoints[1].y;

    let pathSteps = max(1, floor(dist(nowX, nowY, toX, toY)));
    let nowSteps = 0;
    let nowT = 0.0;

    if (config.showCircles) {
        stroke(random(0, 360), 40, 100);
        noFill();
        circle(nowX, nowY, lastCircleSize * 2);
    }
    resultCircles.push(
        new CircleData(_pathPoints[0].x, _pathPoints[0].y, lastCircleSize)
    );

    let lastCircleX = nowX;
    let lastCircleY = nowY;

    let counter = 0;

    // walk and get circles
    while (true) {
        nowT = nowSteps / pathSteps;
        nowX = lerp(fromX, toX, nowT);
        nowY = lerp(fromY, toY, nowT);

        if (config.showPath) {
            noStroke();
            fill("blue");
            circle(nowX, nowY, 2);
        }

        let distToLastCircle = dist(nowX, nowY, lastCircleX, lastCircleY);
        let distToNextPathPoint = dist(nowX, nowY, nextPoint.x, nextPoint.y);

        // arrive dest circle point
        if (distToLastCircle >= nextCircleDist) {
            if (config.showCircles) {
                stroke(random(0, 360), 40, 100);
                noFill();
                circle(nowX, nowY, nextCircleSize * 2);
            }
            resultCircles.push(new CircleData(nowX, nowY, nextCircleSize));

            lastCircleX = nowX;
            lastCircleY = nowY;

            // get next circle
            lastCircleSize = nextCircleSize;
            nextCircleSize = random(_minSize, _maxSize);

            maxDist = lastCircleSize + nextCircleSize;
            minDist = max(lastCircleSize, nextCircleSize);
            nextCircleDist = lerp(minDist, maxDist, random(0.1, 0.9));
        }

        // arrive next path point
        if (nowSteps >= pathSteps) {
            // if it is the last point
            if (pathIndex == _pathPoints.length - 1) {
                // console.log("LASTT!!");
                // console.log(`pathIndex: ${pathIndex}, _pathPoints.length: ${_pathPoints.length}`);

                // add last circle
                let walkDir = getAngle(lastCircleX, lastCircleY, toX, toY) + 90;
                // console.log(`fromX: ${fromX}, fromY: ${fromY}, toX: ${toX}, toY: ${toY}`);
                // console.log("circleDir: " + walkDir);

                let endCircleX =
                    lastCircleX + sin(radians(walkDir)) * nextCircleDist;
                let endCircleY =
                    lastCircleY - cos(radians(walkDir)) * nextCircleDist;

                if (config.showCircles) {
                    stroke(random(0, 360), 40, 100);
                    noFill();
                    circle(endCircleX, endCircleY, nextCircleSize);
                }
                resultCircles.push(
                    new CircleData(endCircleX, endCircleY, nextCircleSize)
                );
                break;
            }

            lastPoint = _pathPoints[pathIndex];

            pathIndex++;

            nextPoint = _pathPoints[pathIndex];
            fromX = toX;
            fromY = toY;
            toX = nextPoint.x;
            toY = nextPoint.y;
            nowSteps = 0;
            pathSteps = max(1, floor(dist(fromX, fromY, toX, toY)));
        }

        counter++;
        nowSteps++;

        if (counter % 100 == 0) {
            if (config.breakWhenPossible) {
                break;
            }
            await sleep(1);
        }
    }

    return resultCircles;
}

/**
 * get the path on the circles
 * @param {CircleData[]} _circles
 * @param {number} _walkSpeed
 * @param {{breakWhenPossible:boolean, showCircles:boolean, showCircleWalkPath: boolean}} config
 * @returns {Promise<PointPath>}
 */
export async function getCircleWalkPath(
    _circles,
    _walkSpeed = 1,
    { showCircleWalkPath }
) {
    // draw on the edge of circles
    let nowCircleIndex = 0;
    let nowWalkingAngle = -90;
    let endWalkingAngle = _circles[nowCircleIndex].getIntersectionAngle(
        _circles[nowCircleIndex + 1]
    )[0];
    let angleStep = _walkSpeed;
    let walkX =
        _circles[nowCircleIndex].x +
        sin(radians(nowWalkingAngle)) * _circles[nowCircleIndex].radius;
    let walkY =
        _circles[nowCircleIndex].y -
        cos(radians(nowWalkingAngle)) * _circles[nowCircleIndex].radius;

    let resultPathData = [];
    let counter = 0;

    while (true) {
        if (showCircleWalkPath) {
            fill("white");
            noStroke();
            circle(walkX, walkY, 6);
        }

        resultPathData.push({ x: walkX, y: walkY });
        // NoisePoint(walkX, walkY);

        nowWalkingAngle += angleStep;

        let walkPoint =
            _circles[nowCircleIndex].getSurfacePoint(nowWalkingAngle);
        walkX = walkPoint.x;
        walkY = walkPoint.y;

        // walk on next cirlce
        if (nowWalkingAngle >= endWalkingAngle) {
            // console.log(`${nowCircleIndex} ${_circles.length}`);
            nowCircleIndex++;

            if (nowCircleIndex == _circles.length - 1) {
                nowWalkingAngle = _circles[nowCircleIndex].getPointAngle(
                    walkX,
                    walkY
                );

                if (nowWalkingAngle > 180) nowWalkingAngle -= 360;

                endWalkingAngle = 90;
            } else if (nowCircleIndex == _circles.length) {
                break;
            } else {
                nowWalkingAngle = _circles[nowCircleIndex].getPointAngle(
                    walkX,
                    walkY
                );

                // make the nowAngle in 0~360 range
                if (nowWalkingAngle > 360) nowWalkingAngle -= 360;
                else if (nowWalkingAngle < 0) nowWalkingAngle += 360;

                endWalkingAngle = _circles[nowCircleIndex].getIntersectionAngle(
                    _circles[nowCircleIndex + 1]
                )[0];

                if (endWalkingAngle < nowWalkingAngle) endWalkingAngle += 360;
            }
        }

        if (counter++ % 100 == 0) await sleep(1);
    }

    return resultPathData;
}

/**
 * returns a promise which resolves to a baseline path (array of points) upon which a cloud layer will be build.
 * May also print out some debugging stuff
 * @param {number} _x1
 * @param {number} _y1
 * @param {number} _x2
 * @param {number} _y2
 * @param {number} _noiseScale
 * @param {number} _wavingHeight
 * @param {{showPath:boolean, breakWhenPossible:boolean}} config
 * @returns {Promise<PointPath>} noise path
 */
export async function getNoisePath(
    _x1,
    _y1,
    _x2,
    _y2,
    _noiseScale,
    _wavingHeight,
    config
) {
    let walkDir = getAngle(_x1, _y1, _x2, _y2) + 90;
    let walkCount = dist(_x1, _y1, _x2, _y2);

    let pathPoints = [];

    for (let i = 0; i < walkCount; i++) {
        let nowX = lerp(_x1, _x2, i / walkCount);
        let nowY = lerp(_y1, _y2, i / walkCount);

        let noiseValue =
            (noise(nowX * _noiseScale, nowY * _noiseScale) - 0.5) * 2;
        let wavingHeight = _wavingHeight * noiseValue;

        let wavingDir = walkDir + 90;
        let wavingX =
            nowX + sin(radians(wavingDir)) * wavingHeight - 0.5 * wavingHeight;
        let wavingY =
            nowY - cos(radians(wavingDir)) * wavingHeight - 0.5 * wavingHeight;

        pathPoints.push({ x: wavingX, y: wavingY });

        if (i % 100 == 0) {
            if (config.breakWhenPossible) {
                break;
            }
            await sleep(1);
        }
    }

    return pathPoints;
}
