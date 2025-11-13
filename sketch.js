import { sleep } from "./animUtils.js";
import { getAngle } from "./CircleData.js";
import { makeCloudPaths } from "./path.js";
//@ts-ignore
import { GUI } from "https://unpkg.com/dat.gui@0.7.9/build/dat.gui.module.js";

/**
 * @typedef {import("./path.js").PointPath} PointPath
 */

const cfg = {
    lineWaveNoiseScale: 0.02,
    lineWavingLength: 3,
    lineThickness: 6,
    lineDensity: 0.15,
    lineSizeNoiseScale: 0.02,
    dotDensity: 0.8,
    dotSize: [1, 3],
    /** titled MONDRIAN in the original sketch.  The base colour used in the sketch.  Its alpha is modified in places */
    myColour: undefined,
    pointNoiseScaleX: 0.06,
    pointNoiseRadius: 3,
    // debug / reveal options
    enableCloudPainting: true,
    showPath: false,
    showBasePaths: false,
    showCircleWalkPath: false,
    stopAfterPaths: false,
    showCircles: false,
    showCloudPaths: false,
    breakWhenPossible: false,
    /** controls how many cloud layers to generate.  Should be set to zero normally for random choice. */
    layerCount: 2,
    disablePartX: false,
};

//this is not config, it is state which changes during the animated render process
let pointNoiseX = 0;
let gui;

function setupGUI() {
    gui = new GUI();
    gui.add(cfg, "enableCloudPainting");
    gui.add(cfg, "lineWavingLength");
    gui.add(cfg, "breakWhenPossible");
    gui.add(cfg, "showBasePaths");
    gui.add(cfg, "showCircles");
    gui.add(cfg, "showCircleWalkPath");
    gui.add(cfg, "showCloudPaths");
    gui.add(cfg, "showPath");
    gui.add(cfg, "stopAfterPaths");
    gui.add(cfg, "disablePartX");
    gui.add(cfg, "layerCount", 0, 20, 1);
}

async function setup() {
    createCanvas(windowWidth, windowHeight);
    setupGUI();
    await redrawFullScene();
}

async function redrawFullScene() {
    background(240);
    cfg.myColour = color(15, 71, 140);

    // background
    const padding = 0.06 * min(width, height);

    cfg.dotDensity = random(0.5, 0.8);
    cfg.lineDensity = random(0.06, 0.2);
    cfg.lineWaveNoiseScale = random(0.02, 0.12);
    cfg.dotSize = [1, 3];
    await NYRectOfNYNoisyLines(
        padding,
        padding,
        width - padding * 2,
        height - padding * 2
    );

    // top frame - this gets drawn before cloud layers as the cloud layers may break out and over the frame.  (lovely!)
    cfg.dotSize = [0, 6];
    NYNoisyLine(padding, padding, width - padding, padding);

    const { paths, cloudPaths } = await makeCloudPaths(padding, cfg);
    if (cfg.breakWhenPossible) {
        return;
    }

    if (cfg.showBasePaths) {
        drawDebugPaths(paths, "yellow", 2);
    }

    if (cfg.showCloudPaths) {
        drawDebugPaths(cloudPaths, "magenta", 3);
    }

    if (cfg.stopAfterPaths) {
        return;
    }

    cfg.dotSize = [1, 3];
    if (cfg.enableCloudPainting) {
        await paintCloudsFromCloudPaths(cloudPaths, padding);
    }
    if (cfg.breakWhenPossible) {
        return;
    }

    //Draw rest of frame -
    // It would have been potentially drawn over if we had drawn it along with the top line
    // Note that the last cloud layer may erase over the bottom of the frame (including lower parts of the sides)
    //A lovely touch!
    cfg.dotSize = [0, 6];
    NYNoisyLine(padding, padding, padding, height - padding);
    NYNoisyLine(width - padding, padding, width - padding, height - padding);
    NYNoisyLine(padding, height - padding, width - padding, height - padding);

    // draw the last cloud, probably overlapping the frame
    cfg.dotSize = [1, 3];
    paintOneCloud(cloudPaths.at(-1), {
        padding,
        alwaysShade: true,
        skipLineShading: false,
    });
}
async function NYRectOfNYNoisyLines(cornerX, cornerY, rectW, rectH) {
    let xLines = rectW * cfg.lineDensity;
    let xLineSpace = rectW / (xLines - 1);

    for (let lineCount = 0; lineCount < xLines; lineCount++) {
        let x1 = cornerX + lineCount * xLineSpace;
        let y1 = cornerY;

        let x2 = x1;
        let y2 = cornerY + rectH;

        NYNoisyLine(x1, y1, x2, y2);
        if (lineCount % 10 === 0) {
            await sleep(1);
        }
    }
}

function NYNoisyLine(_x1, _y1, _x2, _y2) {
    let dotCount = dist(_x1, _y1, _x2, _y2) * cfg.dotDensity;

    let forwardAngle = getAngle(_x1, _y1, _x2, _y2);

    for (let i = 0; i < dotCount; i++) {
        let t = i / dotCount;
        let xPos = lerp(_x1, _x2, t);
        let yPos = lerp(_y1, _y2, t);

        let sizeNoise = noise(
            xPos * cfg.lineSizeNoiseScale,
            yPos * cfg.lineSizeNoiseScale,
            666
        );
        let waveNoise = noise(
            xPos * cfg.lineWaveNoiseScale,
            yPos * cfg.lineWaveNoiseScale,
            999
        );

        let nowDotSize = lerp(cfg.dotSize[0], cfg.dotSize[1], sizeNoise);

        // let wavingNoise = noise(xPos * 0.01, yPos * 0.01, 999) * 2 - 1;
        xPos += sin(radians(forwardAngle)) * cfg.lineWavingLength * waveNoise;
        yPos -= cos(radians(forwardAngle)) * cfg.lineWavingLength * waveNoise;

        strokeWeight(cfg.lineThickness);
        cfg.myColour.setAlpha(255 * random(0.3, 0.6));
        fill(cfg.myColour);
        noStroke();

        circle(xPos, yPos, nowDotSize);
    }
}

function NoisePoint(_x, _y, _scaler = 1) {
    pointNoiseX += cfg.pointNoiseScaleX;
    let offsetY = (noise(pointNoiseX) - 0.5) * 2 * cfg.pointNoiseRadius;

    let sizeNoise = noise(
        _x * cfg.lineSizeNoiseScale,
        _y * cfg.lineSizeNoiseScale,
        666
    );
    let nowDotSize = lerp(cfg.dotSize[0], cfg.dotSize[1], sizeNoise);

    circle(_x, _y + offsetY, nowDotSize * _scaler);
}

//@ts-ignore - these properties don't exist on window
window.setup = setup;
//@ts-ignore
window.draw = () => {};

/**
 *
 * @param {PointPath[]} cloudPaths
 * @param {number} padding
 */
async function paintCloudsFromCloudPaths(cloudPaths, padding) {
    for (let index = 0; index < cloudPaths.length; index++) {
        const isLast = index === cloudPaths.length - 1;
        const isFirst = index === 0;
        await paintOneCloud(cloudPaths[index], {
            padding,
            alwaysShade: isFirst,
            skipLineShading: isLast,
        });
    }
}

/**
 * Paints one cloud layer given its path
 * @param {PointPath} nowPath
 * @param {{padding:number, alwaysShade:boolean, skipLineShading:boolean}} options
 */
async function paintOneCloud(
    nowPath,
    { padding, alwaysShade, skipLineShading }
) {
    //draw the cloudPath
    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        let x2 = x1;
        let y2 = height;

        stroke(240);
        line(x1, y1, x2, y2);

        if (i % 100 == 0) {
            if (cfg.breakWhenPossible) {
                return;
            }

            await sleep(1);
        }
    }

    // draw cloud path
    let shadeNX = random(-1000, 1000);
    let shadeNScale = random(0.003, 0.02);
    let shadeChance = random(0.6, 0.8);

    //typically used for the first cloudPath (and re-do of last cloudPath, after frame drawn)
    if (alwaysShade) {
        shadeChance = 1;
    }

    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        if (x1 < padding || x1 > width - padding) continue;

        shadeNX += shadeNScale;
        let shadeNoise = noise(shadeNX);

        if (shadeNoise < shadeChance) {
            let shadeT = map(shadeNoise, 0, shadeChance, 1, 0);
            let shadeScaler = 1.0;

            if (shadeT < 0.2) shadeScaler = shadeT / 0.2;

            noStroke();
            cfg.myColour.setAlpha(255 * random(0.4, 0.8));
            fill(cfg.myColour);
            NoisePoint(x1, y1, shadeScaler);

            if (i % 20 == 0) {
                if (cfg.breakWhenPossible) {
                    return;
                }
                await sleep(1);
            }
        }
    }

    // draw cloud shade
    let cloudPadding = random(60, 200);
    let cloudPaddingNX = random(-1000, 1000);
    let cloudPaddingNScale = 0.03;
    // let cloudLineSpacing = floor(random(6, 18));
    let cloudLineSpacing = floor(1.0 / cfg.lineDensity);

    if (skipLineShading) {
        return;
    }

    //do line shading inside of this cloud layer
    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        let x2 = x1;
        let y2 = height - padding;

        if (floor(x1) % cloudLineSpacing != 0) continue;

        if (x1 < padding || x1 > width - padding) continue;

        cloudPaddingNX += cloudPaddingNScale;
        let paddingNoise = noise(cloudPaddingNX);

        y1 += cloudPadding * paddingNoise;
        // y1 += random(10, 60);

        if (random() < 0.9) NYNoisyLine(x1, y1, x2, y2);

        if (i % 200 == 0) {
            if (cfg.breakWhenPossible) {
                return;
            }

            await sleep(1);
        }
    }
}
window.keyPressed = function () {
    if (key === "r") {
        redrawFullScene();
    }
};

function drawDebugPaths(paths, colour, weight) {
    push();
    stroke(colour);
    strokeWeight(weight);
    noFill();
    for (let path of paths) {
        beginShape();
        for (let p of path) {
            vertex(p.x, p.y);
        }
        endShape();
    }
    pop();
    return;
}
