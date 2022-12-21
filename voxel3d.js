"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _UUIDController_instances, _UUIDController_arrID, _UUIDController_generateID;
exports.__esModule = true;
exports.BaseObject = exports.UUIDController = exports.BoundingBox = exports.BoundingBoxPayloadModes = exports.JointBoundingBox = exports.JointBoundingBoxActions = void 0;
/**
   * @remarks
   * Specifies the various modes of how data is retrieved for {@link JointBoundingBox.getAllJointBoundingBoxes}
   */
var JointBoundingBoxActions;
(function (JointBoundingBoxActions) {
    /**
     * Specifies that the return type should be an array of every {@link BoundingBox}
     * @remarks
     * Is exactly the same as {@link JointBoundingBox.boundingBoxes}
     */
    JointBoundingBoxActions["RETURN_MODE_FULL_DIRECTORY"] = "RETURN_MODE_FULL_DIRECTORY";
    /**
    * Specifies that the return type should be an array of every {@link BoundingBox.boundingBox}.
    */
    JointBoundingBoxActions["RETURN_MODE_VOXELS_DIRECTORY"] = "RETURN_MODE_VOXELS_DIRECTORY";
    /**
     * Compiles all each of the {@link BoundingBox.boundingBox} into an 2D array of {@link Voxel}. These voxels represent all of the corners of all of the stored boxes.
     */
    JointBoundingBoxActions["RETURN_MODE_VOXELS"] = "RETURN_MODE_VOXELS";
})(JointBoundingBoxActions = exports.JointBoundingBoxActions || (exports.JointBoundingBoxActions = {}));
/**
 * Holds an array of one or more {@link BoundingBox}, and treats them as one box.
 *
 * @remarks
 * When a single box is used to outline the entire 3D space a shape takes up, large voids may appear. For example, encasing a diagonal line in a sqaure leaves mostly empty space.
 *
 * Instead, slice the line into smaller pieces and encase each slice in its own box. Then put all of those slices in a single data structure that treats it as one continuous space boundary.
 */
var JointBoundingBox = /** @class */ (function () {
    function JointBoundingBox(boxes) {
        this.boundingBoxes = [];
        this.boundingBoxes = boxes;
    }
    /**
     * Decides if a given point is in any of the internally stored boxes
     * @param point XYZ Value
     * @returns True if inside, false if it is not.
     */
    JointBoundingBox.prototype.isInside = function (point) {
        if (this.boundingBoxes.length === 0) {
            return false;
        }
        for (var i = 0; i < this.boundingBoxes.length; i++) {
            if (BoundingBox.isInside(point, this.boundingBoxes[i].boundingBox)) {
                return true;
            }
        }
        return false;
    };
    /**
     * @param mode A mode from JointBoundingBoxActions
     * @returns An array of data about each of the {@link JointBoundingBox.boundingBoxes}
     */
    JointBoundingBox.prototype.getAllJointBoundingBoxes = function (mode) {
        return this.boundingBoxes.reduce(function (prev, curr) {
            if (mode === JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY) {
                return prev.push.apply(prev, JSON.parse(JSON.stringify(curr))), prev;
            }
            else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS_DIRECTORY) {
                return prev.push.apply(prev, JSON.parse(JSON.stringify(curr.boundingBox))), prev;
            }
            else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS) {
                return prev.push.apply(prev, BoundingBox.compileBoundingDirectory(curr.boundingBox)), prev;
            }
            else {
                throw new TypeError("Invalid Mode");
            }
        }, []);
    };
    return JointBoundingBox;
}());
exports.JointBoundingBox = JointBoundingBox;
/**
 * Specifies the input payload type for {@link BoundingBox}
 */
var BoundingBoxPayloadModes;
(function (BoundingBoxPayloadModes) {
    /**
     * Specifies that the incoming payload is a {@link BoundingBox.boundingBox}.
     *
     * @remarks
     * This type is most commonly used to copy a {@link BoundingBox}.
    */
    BoundingBoxPayloadModes["TYPE_BOUNDING_DIRECTORY"] = "TYPE_BOUNDING_DIRECTORY";
    /**
     * Specifies that the incoming payload is an array of {@link Voxel} to construct a box around.
     *
     * @remarks
     * This type is most commonly used for {@link BaseObject._fillVoxels}. Take all of the voxels of a given shape and decide the bounds.
     */
    BoundingBoxPayloadModes["TYPE_BOUNDING_POINTS"] = "TYPE_BOUNDING_POINTS";
})(BoundingBoxPayloadModes = exports.BoundingBoxPayloadModes || (exports.BoundingBoxPayloadModes = {}));
var BoundingBox = /** @class */ (function () {
    /**
     * @remarks
     * Automatically calls {@link BoundingBox.calculateRange} to generate all required metadata.
     * @param options
     */
    function BoundingBox(options) {
        /**
         * Stores the XYZ corner data of all eight vertices of the current bounding box.
         *
         * In the context of bounding boxes, the backwards face is the one closet to the viewer.
         * The forward face is the one furthest away
         *
         * Breakdown of the unit box, which is a square of side length one. A side length of one is the shortest it can be whilst still fitting the libraries tesselation.
         *
         * 0 = Backwards Lower Left: [0,0,0]
         *
         * 1 = Backwards Lower Right: [1,0,0]
         *
         * 2 = Backwards Upper Left: [0,1,0]
         *
         * 3 = Backwards Upper Right: [1,1,0]
         *
         * 4 = Forwards Lower Left: [0,0,1]
         *
         * 5 = Forwards Lower Right: [1,0,1]
         *
         * 6 = Forwards Upper Left: [0,1,1]
         *
         * 7 = Forwards Upper Right: [1,1,1]
         */
        this.boundingBox = {
            "0": [0, 0, 0],
            "1": [0, 0, 0],
            "2": [0, 0, 0],
            "3": [0, 0, 0],
            "4": [0, 0, 0],
            "5": [0, 0, 0],
            "6": [0, 0, 0],
            "7": [0, 0, 0]
        };
        /**
         * The coordinate of the lowest Y value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.yLow = -1;
        /**
         * The coordinate of the highest Y value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.yHigh = -1;
        /**
         * The coordinate of the lowest X value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.xLow = -1;
        /**
         * The coordinate of the highest X value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.xHigh = -1;
        /**
         * The coordinate of the lowest Z value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.zLow = -1;
        /**
         * The coordinate of the highest Z value that the current {@link BoundingBox.boundingBox} contains.
         */
        this.zHigh = -1;
        /**
         * The distance between the xLow and xHigh (abs)
         */
        this.xRange = -1;
        /**
         * The distance between the yLow and yHigh (abs)
         */
        this.yRange = -1;
        /**
         * The distance between the zLow and zHigh (abs)
         */
        this.zRange = -1;
        /**
         * Sorted list containing "xRange", "yRange", and "zRange", where the order significes from largest to smallest range values as stored within the metadata.
         *
         * Used to figure out what axis to slice a given shape when filling in polygons. Also used to number the keys within {@link SortedFillVoxelsDirectoryType} via {@link BoundingBox.sortFillVoxels}
         *
         * A value of:
         *
         * ["zRange", "yRange", "xRange"]
         *
         * Represents that the {@link BoundingBox.zRange} >= {@link BoundingBox.yRange} >= {@link BoundingBox.xRange}
         */
        this.biggestRangeLabaled = [];
        /**
         * Sorted list containing 0, 1, and 2, where the order significes the largest to smallest range values within the box metadata.
         *
         * These indices are designed to line up with the {@link Voxel} data type.
         *
         * This metadata is used to sort a given voxel by the largest axis within {@link BaseObject.sortFillVoxels}.
         *
         * For example, a value of:
         *
         * [2,1,0]
         *
         * Represents that the current {@link BoundingBox.zRange} >= {@link BoundingBox.yRange} >= {@link BoundingBox.xRange}
         */
        this.biggestRangeIndex = [];
        /**
         * Sorted list containing "xLow", "yLow", and "zlow", where the order significes from largest to smallest range values as stored within the metadata.
         *
         * Used to figure out what axis to slice a given shape when filling in polygons. Also used to number the keys within {@link SortedFillVoxelsDirectoryType} via {@link BoundingBox.sortFillVoxels}
         *
         * A value of:
         *
         * ["zLow", "yLow", "xLow"]
         *
         * Represents that the {@link BoundingBox.zRange} >= {@link BoundingBox.yRange} >= {@link BoundingBox.xRange}
         */
        this.biggestRangeLabaledLow = [];
        /**
         * Sorted list containing "xHigh", "yHigh", and "zHigh", where the order significes from largest to smallest range values as stored within the metadata.
         *
         * Used to figure out what axis to slice a given shape when filling in polygons. Also used to number the keys within {@link SortedFillVoxelsDirectoryType} via {@link BoundingBox.sortFillVoxels}
         *
         * A value of:
         *
         * ["zHigh", "yHigh", "xHigh"]
         *
         * Represents that the {@link BoundingBox.zRange} >= {@link BoundingBox.yRange} >= {@link BoundingBox.xRange}
         */
        this.biggestRangeLabaledHigh = [];
        if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_DIRECTORY) {
            this.setBoundingBox(options.boundingInputPayload);
        }
        else if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS) {
            this.createBoundingBox(options.boundingInputPayload);
        }
    }
    BoundingBox.getEmptyBoundingTemplate = function () {
        return {
            "0": [],
            "1": [],
            "2": [],
            "3": [],
            "4": [],
            "5": [],
            "6": [],
            "7": []
        };
    };
    /**
     * @remarks
     * Copies the passed in bounding box as the new internally stored box (mutation free), recalculates all required range metadata via {@link BoundingBox.calculateRange}
     * @param boundingBoxStructure
     */
    BoundingBox.prototype.setBoundingBox = function (boundingBoxStructure) {
        for (var i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
            var key = String(i);
            this.boundingBox[key] = __spreadArray([], boundingBoxStructure[key], true);
        }
        this.calculateRange();
    };
    /**
     * Checks if a given point falls within the 3D space this box covers.
     * @param arr The given XYZ Point
     * @param b2 The bounding box to check
     * @returns True if inside, false if not.
     */
    BoundingBox.isInside = function (arr, b2) {
        return (arr[0] >= b2[0][0] &&
            arr[0] <= b2[1][0] &&
            arr[1] >= b2[0][1] &&
            arr[1] <= b2[2][1] &&
            arr[2] >= b2[0][2] &&
            arr[2] <= b2[4][2]);
    };
    /**
     * @remarks
     * Used by {@link JointBoundingBox}
     * @param b3 The Bounding Box corner directory
     * @returns An array of all of the corner voxels.
     */
    BoundingBox.compileBoundingDirectory = function (b3) {
        var voxels = [];
        for (var i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
            var key = String(i);
            if (b3[key].length === 3) {
                voxels.push(__spreadArray([], b3[key], true));
            }
        }
        return voxels;
    };
    /**
     * Calculates all of the metadata based on the current {@link BoundingBox.boundingBox}. This includes the point extremes and ranges on all three axes.
     * @param array2D
     */
    BoundingBox.prototype.calculateRange = function () {
        var array2D = BoundingBox.compileBoundingDirectory(this.boundingBox);
        var xValues = array2D.reduce(function (prev, curr) { return prev.push(curr[0]), prev; }, []).sort(function (a, b) { return a - b; });
        var yValues = array2D.reduce(function (prev, curr) { return prev.push(curr[1]), prev; }, []).sort(function (a, b) { return a - b; });
        var zValues = array2D.reduce(function (prev, curr) { return prev.push(curr[2]), prev; }, []).sort(function (a, b) { return a - b; });
        this.xLow = xValues[0];
        this.xHigh = xValues[xValues.length - 1];
        this.yLow = yValues[1];
        this.yHigh = yValues[yValues.length - 1];
        this.zLow = zValues[2];
        this.zHigh = zValues[zValues.length - 1];
        this.zRange = Math.abs(this.zHigh - this.zLow);
        this.yRange = Math.abs(this.yHigh - this.yLow);
        this.xRange = Math.abs(this.xHigh - this.xLow);
        var rangeKey = {
            "xRange": {
                v: this.xRange,
                i: 0
            },
            "yRange": {
                v: this.yRange,
                i: 1
            },
            "zRange": {
                v: this.zRange,
                i: 2
            }
        };
        this.biggestRangeLabaled = ["xRange", "yRange", "zRange"].sort(function (a, b) { return rangeKey[b].v - rangeKey[a].v; });
        this.biggestRangeLabaledLow = this.biggestRangeLabaled.map(function (n) { return n.replace("Range", "Low"); });
        this.biggestRangeLabaledHigh = this.biggestRangeLabaled.map(function (n) { return n.replace("Range", "High"); });
        this.biggestRangeIndex = this.biggestRangeLabaled.map(function (n) { return rangeKey[n].i; });
    };
    /**
     * Creates a new bounding box that encompasses a group of points. Stores internally as {@link BoundingBox.boundingBox}. Automatically calculates range via {@link BoundingBox.calculateRange}
     * @param array2D
     */
    BoundingBox.prototype.createBoundingBox = function (array2D) {
        if (array2D.length > 0) {
            this.calculateRange();
            this.boundingBox[0] = [this.xLow, this.yLow, this.zLow];
            this.boundingBox[7] = [this.xHigh, this.yHigh, this.zHigh];
        }
        else {
            throw new RangeError("Invalid BoundingBox.createBoundingBox argument: array2D must contain at least one XYZ voxel.");
        }
    };
    /**
     * Returns the amount of entries within a {@link PartialBoundingBox} that are valid {@link Voxel}, used by the {@link BoundingBox.correctBoundingBox} method.
     * @param b3 Bounding Box
     * @returns Count
     */
    BoundingBox.findEntryCount = function (b3) {
        var entryCount = 0;
        for (var i in b3) {
            if (b3[i].length > 0) {
                entryCount++;
            }
        }
        return entryCount;
    };
    /**
    * @remarks Checks if a horizontal line, ranging from positive to negative infinity on the x-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
    * @param  V Given Point
    * @param BL Bottom left of plane
    * @param  BR Bottom right of plane
    * @param  UL Upper left of plane
    * @returns True if the vector passes through, false otherwise.
    */
    BoundingBox.horizontalCheck = function (V, BL, BR, UL) {
        return (V[2] >= BL[2] && V[2] <= BR[2] && V[1] >= BL[1] && V[1] <= UL[1]);
    };
    /**
     * @remarks Checks if a vertical line, ranging from positive to negative infinity on the y-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
     * @param  V Given Point
     * @param  BL Bottom left of plane
     * @param  BR Bottom right of plane
     * @param UL Upper left of plane
     * @returns True if the vector passes through, false otherwise.
     */
    BoundingBox.verticalCheck = function (V, BL, BR, UL) {
        return (V[0] >= BL[0] && V[0] <= BR[0] && V[2] <= UL[2] && V[2] >= BL[2]);
    };
    /**
   * @remarks Checks if a depth line, ranging from positive to negative infinity on the z-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
   * @param  V Given Point
   * @param BL Bottom left of plane
   * @param  BR Bottom right of plane
   * @param  UL Upper left of plane
   * @returns True if the vector passes through, false otherwise.
   */
    BoundingBox.depthCheck = function (V, BL, BR, UL) {
        return (V[0] >= BL[0] && V[0] <= BR[0] && V[1] <= UL[1] && V[1] >= BL[1]);
    };
    /**
    * @remarks Generates a new {@link BoundingBox.boundingBox} from the intersection between two inputted boxes. Used to find the cubic range area that is shared between two boxes, if any.
    * @param b1 Box 1
    * @param b2 Box 2
    * @returns Returns an array, and if the first element is true, then the second element is the intersection {@link BoundingBox.boundingBox}. Otherwise, the intersection is not possible (false).
    */
    BoundingBox.boundingBoxIntersect = function (b1, b2) {
        var b3 = BoundingBox.getEmptyBoundingTemplate();
        for (var _i = 0, _b = __classPrivateFieldGet(this, _a, "f", _BoundingBox_VP)[0]; _i < _b.length; _i++) {
            var xp = _b[_i];
            // check if b1 is inside b2
            // if xp0 and xp1's vectors extending infitly in x direction,
            // pass through planes defined by 0,4,2 and 1,5,3
            var left = BoundingBox.horizontalCheck(b1[xp[0] + ""], b2[0], b2[2], b2[4]);
            var right = BoundingBox.horizontalCheck(b1[xp[1] + ""], b2[1], b2[3], b2[5]);
            if (left && right) {
                // b1-left-x >= b2-0-x
                if (b1[xp[0] + ""][0] <= b2[0][0]) {
                    // b3-left = b2-0-x, b1-left-y, b1-left-z
                    b3[xp[0] + ""] = [b2[0][0], b1[xp[0] + ""][1], b1[xp[0] + ""][2]];
                }
                else {
                    // b3-left = b1-left
                    b3[xp[0] + ""] = __spreadArray([], b1[xp[0] + ""], true);
                }
                // b1-right-x >= b2-right-x
                if (b1[xp[1] + ""][0] >= b2[1][0]) {
                    // b3-right = b2-right-x, b1-right-y, b1-right-z
                    b3[xp[1] + ""] = [b2[1][0], b1[xp[1] + ""][1], b1[xp[1] + ""][2]];
                }
                else {
                    // b3-right = b1-right
                    b3[xp[1] + ""] = __spreadArray([], b1[xp[1] + ""], true);
                }
            }
        }
        for (var _c = 0, _d = __classPrivateFieldGet(this, _a, "f", _BoundingBox_VP)[1]; _c < _d.length; _c++) {
            var yp = _d[_c];
            // if down's vectors extends through plane 0, 1, 4
            var down = BoundingBox.verticalCheck(b1[yp[0] + ""], b2[0], b2[1], b2[4]);
            // if ups vectors extends through plane 2, 3, 6
            var up = BoundingBox.verticalCheck(b1[yp[1] + ""], b2[2], b2[3], b2[6]);
            if (up && down) {
                // b1-down-y >= b2-2-y
                if (b1[yp[0] + ""][1] <= b2[1][1]) {
                    // b3-down = b1-down-x, b2-0-y, b1-down-z
                    b3[yp[0] + ""] = [b1[yp[0] + ""][0], b2[0][1], b1[yp[0] + ""][2]];
                }
                else {
                    // b3-down = b1-down
                    b3[yp[0] + ""] = __spreadArray([], b1[yp[0] + ""], true);
                }
                // b1-up-y >= b2-2-y
                if (b1[yp[1] + ""][1] >= b2[2][1]) {
                    // b3-up = b1-up-x, b2-0-y, b1-up-z
                    b3[yp[1] + ""] = [b1[yp[1] + ""][0], b2[2][1], b1[yp[1] + ""][2]];
                }
                else {
                    // b3-up = b2-up
                    b3[yp[1] + ""] = __spreadArray([], b1[yp[1] + ""], true);
                }
            }
        }
        for (var _e = 0, _f = __classPrivateFieldGet(this, _a, "f", _BoundingBox_VP)[2]; _e < _f.length; _e++) {
            var zp = _f[_e];
            // if closet point vector extends through plane 4,5,6
            var closet = BoundingBox.depthCheck(b1[zp[0] + ""], b2[0], b2[1], b2[2]);
            // if farthest points vector extends through 0,1,2
            var further = BoundingBox.depthCheck(b1[zp[1] + ""], b2[4], b2[5], b2[6]);
            // if both these poins align through the planes
            if (closet && further) {
                // b1-close-z <= b2-0-z
                if (b1[zp[0] + ""][2] <= b2[0][2]) {
                    // b3-close = close-x, close-y b2-0-z
                    b3[zp[0] + ""] = [b1[zp[0] + ""][0], b1[zp[0] + ""][1], b2[0][2]];
                }
                else {
                    // b3-close = b1-close
                    b3[zp[0] + ""] = __spreadArray([], b1[zp[1] + ""], true);
                }
                // b1-far-z >= b2-6-2
                if (b1[zp[1] + ""][2] >= b2[6][2]) {
                    // b3-far = far-x. far-y. b2-6-z
                    b3[zp[1] + ""] = [b1[zp[1] + ""][0], b1[zp[1] + ""][1], b2[6][2]];
                }
            }
        }
        return BoundingBox.correctBoundingBox(b3)[1];
    };
    /**
    * @remarks Fills in the missing {@link Voxel} entries for a given {@link BoundingBox.boundingBox}. Used within the {@link BoundingBox.boundingBoxIntersect} method because of the partial boxes produced.
    *
    * Some boxes may be inpossible to correct, such as a box with only the corner vertices 6 and 7. This single edge does not provide a varying y or z value, therfore it is impossible to correct the box.
    *
    * However, giving points 0 and 7 gives a variation in x, y and z values. This will allow the program to fill in the missing {@link Voxel} entries.
    *
    * @param b3 Box to correct
    * @returns An array containing a boolean as the first element. If the boolean is true, then the second element is the corrected {@link BoundingBox.boundingBox} with all entries filed in.
    *
    */
    BoundingBox.correctBoundingBox = function (b3) {
        var entryCount = BoundingBox.findEntryCount(b3);
        // first, check if the object only shares one corner
        if (entryCount <= 1) {
            return [false, b3];
        }
        // Auto-generated identies to check if a given boundingbox is correctable based on its then filled vertices
        // Generated using a truth table of all combinations, with selection of only true rows, then selection of only true points, then idenitiy simplification.
        if (!((BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [6]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [6]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [6]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [6]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [0]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [1]) && BoundingBox.isDef(b3, [6]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [6]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [4]) && BoundingBox.isDef(b3, [7]))
            || (BoundingBox.isDef(b3, [2]) && BoundingBox.isDef(b3, [5]))
            || (BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [4]))
            || (BoundingBox.isDef(b3, [3]) && BoundingBox.isDef(b3, [5]) && BoundingBox.isDef(b3, [6])))) {
            return [false, b3];
        }
        while (entryCount < 8) {
            // Calculate top planes
            // 7 --> 2
            // If indices 6 and 3 are not defined (demorgans law) and 7 and 2 are defined
            if (!BoundingBox.isDef(b3, [6, 3]) && BoundingBox.isDef(b3, [7, 2])) {
                b3[3] = [b3[7][0], b3[7][1], b3[2][2]]; // QA
                b3[6] = [b3[2][0], b3[2][1], b3[7][2]]; // QA
            }
            // 6 --> 3
            if (!BoundingBox.isDef(b3, [2, 7]) && BoundingBox.isDef(b3, [6, 3])) {
                b3[2] = [b3[6][0], b3[6][1], b3[3][2]]; // QA
                b3[7] = [b3[3][0], b3[3][1], b3[6][2]]; // QA
            }
            // calculate bottom planes
            // 5 -> 0
            if (!BoundingBox.isDef(b3, [4, 1]) && BoundingBox.isDef(b3, [5, 0])) {
                b3[4] = [b3[0][0], b3[0][1], b3[5][2]]; // QA
                b3[1] = [b3[5][0], b3[5][1], b3[0][2]]; // QA
            }
            // 4 --> 1
            if (!BoundingBox.isDef(b3, [5, 0]) && BoundingBox.isDef(b3, [4, 1])) {
                b3[5] = [b3[1][0], b3[1][1], b3[4][2]]; // QA
                b3[0] = [b3[4][0], b3[4][2], b3[1][2]]; // QA 
            }
            // calculate front plane
            // 3 -> 0
            if (!BoundingBox.isDef(b3, [2, 1]) && BoundingBox.isDef(b3, [3, 0])) {
                b3[2] = [b3[0][0], b3[3][1], b3[3][2]]; // QA
                b3[1] = [b3[3][0], b3[0][1], b3[0][2]]; // QA
            }
            // 2 --> 1  
            if (!BoundingBox.isDef(b3, [3, 0]) && BoundingBox.isDef(b3, [2, 1])) {
                b3[3] = [b3[1][0], b3[2][1], b3[2][2]]; // QA
                b3[0] = [b3[2][0], b3[1][1], b3[1][2]]; // QA
            }
            // calculate 4 -> 7
            // back plane
            if (!BoundingBox.isDef(b3, [5, 6]) && BoundingBox.isDef(b3, [4, 7])) {
                b3[5] = [b3[7][0], b3[4][1], b3[4][2]]; // QA
                b3[6] = [b3[4][0], b3[7][1], b3[7][2]]; // QA
            }
            // 5 --> 6
            if (!BoundingBox.isDef(b3, [4, 7]) && BoundingBox.isDef(b3, [5, 6])) {
                b3[4] = [b3[6][0], b3[5][1], b3[5][2]]; // QA
                b3[7] = [b3[5][0], b3[6][1], b3[6][2]]; // QA 
            }
            // calculate left plane
            // 6 -> 0
            if (!BoundingBox.isDef(b3, [2, 4]) && BoundingBox.isDef(b3, [6, 0])) {
                b3[2] = [b3[0][0], b3[6][1], b3[0][2]]; // QA
                b3[4] = [b3[6][0], b3[0][1], b3[6][2]]; // QA
            }
            // 2 --> 4
            if (!BoundingBox.isDef(b3, [6, 0]) && BoundingBox.isDef(b3, [2, 4])) {
                b3[6] = [b3[2][0], b3[2][1], b3[4][2]]; // QA
                b3[0] = [b3[2][0], b3[4][1], b3[2][2]]; // QA 
            }
            // calculate right plane
            // 3 --> 5
            if (!BoundingBox.isDef(b3, [7, 1]) && BoundingBox.isDef(b3, [3, 5])) {
                b3[7] = [b3[3][0], b3[3][1], b3[5][2]]; // QA
                b3[1] = [b3[3][0], b3[5][1], b3[3][2]]; // QA
            }
            // 1 -> 7
            if (!BoundingBox.isDef(b3, [3, 5]) && BoundingBox.isDef(b3, [7, 1])) {
                b3[3] = [b3[1][0], b3[7][1], b3[1][2]]; // QA
                b3[5] = [b3[1][0], b3[1][1], b3[7][2]]; // QA
            }
            if (!BoundingBox.isDef(b3, [4, 4]) && BoundingBox.isDef(b3, [7, 0])) {
                b3[4] = [b3[0][0], b3[0][1], b3[7][2]]; // QA
            }
            // 1 -> 6
            if (!BoundingBox.isDef(b3, [2, 2]) && BoundingBox.isDef(b3, [1, 6])) {
                b3[2] = [b3[6][0], b3[6][1], b3[1][2]]; // QA
            }
            // 2 --> 5
            if (!BoundingBox.isDef(b3, [3, 3]) && BoundingBox.isDef(b3, [2, 5])) {
                b3[3] = [b3[5][0], b3[2][1], b3[2][2]]; // QA
            }
            // 4 --> 3
            if (!BoundingBox.isDef(b3, [6, 6]) && BoundingBox.isDef(b3, [4, 3])) {
                b3[6] = [b3[4][0], b3[3][1], b3[4][2]]; // QA
            }
            entryCount = BoundingBox.findEntryCount(b3);
        }
        return [true, b3];
    };
    var _a, _BoundingBox_VP;
    _a = BoundingBox;
    BoundingBox.BOX_VERTICE_COUNT = 8;
    /**
    * @remarks Defines the ordered pairs of vertices from a {@link BoundingBox.boundingBox} for use within the {@link BoundingBox.boundingBoxIntersect} method.
    *
    * The first array of pairs signify all of the horizontal edge pairs in left to right order.
    *
    * The second array of pairs signify all of the vertical edge pairs in bottom to top order.
    *
    * The third array of pairs signify all of the depth edge pairs in forward (towards [0,0,0]) to back (towards [1,1,1]) order.
    *
    * These pairs represent the edges of intersecting boxes. If the 0 to 1 edge from one box passes through vertical x-planes of the intersecting box, the boxes are intersecting and intersection points can be created.
    */
    _BoundingBox_VP = { value: [
            [[0, 1], [2, 3], [6, 7], [4, 5]],
            [[0, 2], [1, 3], [4, 6], [5, 7]],
            [[2, 6], [3, 7], [0, 4], [1, 5]]
        ] };
    /**
     * Checks if all of the given vertice numbers are defined within {@link BoundingBox.boundingBox} b3 (valid {@link Voxel}).
     *
     * @remarks Used internally by {@link BoundingBox.correctBoundingBox}. Can also be used to tell if a given {@link PartialBoundingBox} can be casted to a {@link CompleteBoundingBox}
     *
     * @param b3
     * @param args List of vertices to check if all are defined
     * @returns True if all are defined, false otherwise.
     */
    BoundingBox.isDef = function (b3, args) {
        for (var i = 0; i < args.length; i++) {
            if (b3[args[i] + ""].length === 0) {
                return false;
            }
        }
        return true;
    };
    return BoundingBox;
}());
exports.BoundingBox = BoundingBox;
/**
 * A controller for all of the universally unique identifications within the program. Contains a database where objects can choose to attatch a reference for each ID.
 *
 * @remarks
 */
var UUIDController = /** @class */ (function () {
    function UUIDController() {
        _UUIDController_instances.add(this);
        /**
         * A list of all UUID's managed by this controller
         */
        _UUIDController_arrID.set(this, void 0);
        __classPrivateFieldSet(this, _UUIDController_arrID, [], "f");
        this._objIDReferance = {};
    }
    /**
     *
     * @returns A random unicode character between either 47 to 57 decimal (U+0030 - U+0039) or 97 to 122 (U+0061 - U+007A)
     */
    UUIDController.prototype._randomChar = function () {
        var choice = Math.random() > 0.5;
        return String.fromCodePoint(Math.floor(Math.random() * (choice ? 26 : 10) + (choice ? 97 : 48)));
    };
    /**
     * Adds a new reference to the {@link UUIDController._objIDReferance} database.
     * @param id The UUID
     * @param reference Object reference
     */
    UUIDController.prototype.setReferenceEntry = function (id, reference) {
        this._objIDReferance[id] = reference;
    };
    /**
     * Removes the key/value pair via delete within the {@link UUIDController._objIDReferance} database.
     *
     * @example
     * delete this._objIDReferance[id]
     *
     * @param id Target key via UUID
     */
    UUIDController.prototype.removeReferenceEntry = function (id) {
        delete this._objIDReferance[id];
    };
    /**
     * Generates a new 36 character UUID and is added to {@link UUIDController.#arrID}.
     *
     * @returns A new UUID
     */
    UUIDController.prototype.getNewID = function () {
        var id = __classPrivateFieldGet(this, _UUIDController_instances, "m", _UUIDController_generateID).call(this);
        while (__classPrivateFieldGet(this, _UUIDController_arrID, "f").indexOf(id) !== -1) {
            id = __classPrivateFieldGet(this, _UUIDController_instances, "m", _UUIDController_generateID).call(this);
        }
        __classPrivateFieldGet(this, _UUIDController_arrID, "f").push(id);
        return id;
    };
    /**
     * Removes the UUID from the controller's memory
     * @param id UUID to remove
     * @returns A mutation free copy of all of the ID's
     */
    UUIDController.prototype.removeID = function (id) {
        __classPrivateFieldSet(this, _UUIDController_arrID, __classPrivateFieldGet(this, _UUIDController_arrID, "f").filter(function (n) { return id !== n; }), "f");
        return __spreadArray([], __classPrivateFieldGet(this, _UUIDController_arrID, "f"), true);
    };
    /**
     * @returns A mutation free copy of all of the ID's
     */
    UUIDController.prototype.getAllID = function () {
        return __spreadArray([], __classPrivateFieldGet(this, _UUIDController_arrID, "f"), true);
    };
    /**
     * @param id UUID to add
     * @returns True if this ID could be added, false if it was a duplicate and could not be added.
     */
    UUIDController.prototype.addID = function (id) {
        if (__classPrivateFieldGet(this, _UUIDController_arrID, "f").indexOf(id) === -1) {
            __classPrivateFieldGet(this, _UUIDController_arrID, "f").push(id);
            return true;
        }
        return false;
    };
    /**
     * Resets {@link UUIDController.#arrID} to an empty array.
     */
    UUIDController.prototype.clearAllID = function () {
        __classPrivateFieldSet(this, _UUIDController_arrID, [], "f");
    };
    return UUIDController;
}());
exports.UUIDController = UUIDController;
_UUIDController_arrID = new WeakMap(), _UUIDController_instances = new WeakSet(), _UUIDController_generateID = function _UUIDController_generateID() {
    var uuid = "";
    for (var i = 1; i < 37; i++) {
        switch (i) {
            case 9:
            case 14:
            case 19:
            case 24:
                uuid += "-";
                break;
            default:
                uuid += this._randomChar();
        }
    }
    return uuid;
};
/**
 * A BaseObject holds the most basic data structures required to construct a 3D tesselated shape.
 *
 * @remarks
 * See the instance attributes for the baseline requirements to be considered a shape.
 */
var BaseObject = /** @class */ (function () {
    function BaseObject(options) {
        this.controller = options.controller;
        this.uuid = options.controller.getNewID();
        // Inital value
        this._fillVoxels = [[0, 0, 0]];
        this._origin = __spreadArray([], options.origin, true);
        this.boundingBox = new BoundingBox({
            boundingInputPayload: BaseObject.addOrigin(this._fillVoxels, this._origin),
            inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS
        });
        var output = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox);
        this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory;
        this.jointBoundingBox = output.jointBoundingBox;
    }
    /**
     * Adds a given origin to a array of voxels.
     * @param arr Voxel array
     * @param o Origin
     * @returns mutation free copy of the voxels with origin.
     *
     * @remarks
     * Used by {@link BaseObject.getFillVoxels}.
     */
    BaseObject.addOrigin = function (arr, o) {
        return arr.reduce(function (prev, curr) {
            return prev.push([curr[0] + o[0], curr[1] + o[1], curr[2] + o[2]]), prev;
        }, []);
    };
    /**
     * Getter method.
     *
     * @returns Mutation free copy of the shape origin.
     */
    BaseObject.prototype.getOrigin = function () {
        return __spreadArray([], this._origin, true);
    };
    /**
     *
     * @returns The shapes {@link BaseObject._fillVoxels} within origin accounted for, mutation free copy.
     *
     * @remarks
     * A pass through method to {@link BaseObject.addOrigin} (see example).
     *
     * @example
     * // Source code
     * return BaseObject.addOrigin(this._fillVoxels, this.getOrigin());
     */
    BaseObject.prototype.getFillVoxels = function () {
        return BaseObject.addOrigin(this._fillVoxels, this.getOrigin());
    };
    /**
     * Since the {@link BaseObject.boundingBox}, {@link BaseObject.sortedFillVoxelsDirectory}, and {@link BaseObject.jointBoundingBox} are all based on the current {@link BaseObject._fillVoxels}, a change to the fill voxels or origin will now make these directories wrong.
     *
     * Each time the fill voxels or origin are changed, this method must be called. Any built in subclass of {@link BaseObject} that changes fill voxels, such as {@link Line.generateLine}, will automatically call this method.
     */
    BaseObject.prototype.calculateBoundingBox = function () {
        this.boundingBox = new BoundingBox({
            inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
            boundingInputPayload: this.getFillVoxels()
        });
        var output = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox);
        this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory;
        this.jointBoundingBox = output.jointBoundingBox;
    };
    /**
     * Changes the current shapes origin and calls {@link BaseObject.calculateBoundingBox}
     * @param o New Origin
     *
     * @example
     * // Source code
     * this._origin = [...o]
     * this.calculateBoundingBox()
     */
    BaseObject.prototype.setOrigin = function (o) {
        this._origin = __spreadArray([], o, true);
        this.calculateBoundingBox();
    };
    /**
     * Takes in a array of {@link Voxel} and uses the {@link BoundingBox} that surronds the voxels to catagorize them. The largest axis of the bounding box is used to slice the voxel collection,
     * and group it together into a directory where the entry key is the coordinate value, and entry value is all voxels that have that axis value.
     *
     * @remarks
     * Used by {@link BaseObject.calculateBoundingBox}
     *
     * @param inputVoxels Array of voxels
     * @param InputBoundingObject Bounding box that surronds the voxels
     * @returns A data directory {@link SortFillVoxelsOutput}
     */
    BaseObject.sortFillVoxels = function (inputVoxels, InputBoundingObject) {
        var sortedFillVoxelsDirectory = {};
        var sliceBoundingBoxDirectory = [];
        if (inputVoxels.length === 0) {
            return {
                jointBoundingBox: new JointBoundingBox([]),
                sortedFillVoxelsDirectory: sortedFillVoxelsDirectory
            };
        }
        var biggestRangeIndex = InputBoundingObject.biggestRangeIndex, biggestRangeLabaledHigh = InputBoundingObject.biggestRangeLabaledHigh, biggestRangeLabaledLow = InputBoundingObject.biggestRangeLabaledLow;
        for (var i = InputBoundingObject[biggestRangeLabaledLow[0]]; i <= InputBoundingObject[biggestRangeLabaledHigh[0]]; i++) {
            sortedFillVoxelsDirectory[i] = [];
        }
        for (var i = 0; i < inputVoxels.length; i++) {
            var voxel = inputVoxels[i];
            sortedFillVoxelsDirectory[voxel[biggestRangeIndex[0]]].push(__spreadArray([], voxel, true));
        }
        for (var _i = 0, _b = Object.keys(sortedFillVoxelsDirectory); _i < _b.length; _i++) {
            var key = _b[_i];
            var fillKey = Number(key);
            sliceBoundingBoxDirectory.push(new BoundingBox({
                inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
                boundingInputPayload: sortedFillVoxelsDirectory[fillKey]
            }));
        }
        return {
            jointBoundingBox: new JointBoundingBox(sliceBoundingBoxDirectory),
            sortedFillVoxelsDirectory: sortedFillVoxelsDirectory
        };
    };
    /**
     * Checks to see if the elements in one array are strictly equal to the other. Order and size of inputs are also accounted for.
     *
     * @remarks
     * May be removed from the library in future iterations
     *
     * @param a1
     * @param a2
     * @returns True if they are the same, false otherwise
     */
    BaseObject.compare2d = function (a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }
        if (Array.isArray(a1) && Array.isArray(a2)) {
            for (var i = 0; i < a1.length; i++) {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            }
            return true;
        }
        else {
            console.warn('compare2d | One or more of the inputs is not an array |' + new Date);
            return false;
        }
    };
    /**
     * Pushes all of the elements from one array into another. Uses the spread operator on each element for a semi-deep copy.
     *
     * Both arrays must be 2D matrices and each element must be an array.
     *
     * @remarks
     * Attempting to spread operator an entire array of millions of elements will result in memory errors.
     * To fix this, use a loop instead instead and spread operation each element.
     * This is used by all of the default subclasses to pass millions of voxels around while preventing mutations.
     *
     * @param from Pointer of array to push from
     * @param to Pointer of the array to push to
     * @returns All elements from "from" inputted into "to". Retruns original reference to "to".
     */
    BaseObject.push2D = function (from, to) {
        for (var _i = 0, from_1 = from; _i < from_1.length; _i++) {
            var n = from_1[_i];
            to.push(__spreadArray([], n, true));
        }
        return to;
    };
    BaseObject.deepCopy = function (object) {
        return JSON.parse(JSON.stringify(object));
    };
    /**
     * Generates a 3D tesselated line betwene a start and end point.
     *
     * @remarks
     * Due to tesselation, the lines generated from start to end may differ from the coordinates produced by going from end to start (lack of symmetry).
     *
     * To solve this issue, use the {@link Line} subclass instead with {@link LineTypes.DOUBLE_PASS_LINE} for symmertic lines.
     *
     * @param x1 Starting X Value
     * @param y1 Starting Y Value
     * @param z1 Starting Z Value
     * @param x2 Ending X Value
     * @param y2 Ending Y Value
     * @param z2 Ending Z Value
     * @returns Array of all of the {@link Voxel} for this line.
     */
    BaseObject.graph3DParametric = function (x1, y1, z1, x2, y2, z2) {
        var dy = y2 - y1;
        var dx = x2 - x1;
        var dz = z2 - z1;
        var qChange = {
            x: dx < 0 ? -1 : 1,
            y: dy < 0 ? -1 : 1,
            z: dz < 0 ? -1 : 1
        };
        if (dx < 1 && dx > -1) {
            qChange.x = 0;
        }
        if (dy < 1 && dy > -1) {
            qChange.y = 0;
        }
        if (dz < 1 && dz > -1) {
            qChange.z = 0;
        }
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        dz = Math.abs(dz);
        var largestChange;
        if (dy >= dz && dy >= dx) {
            largestChange = "y";
        }
        else if (dx >= dy && dx >= dz) {
            largestChange = "x";
        }
        else {
            largestChange = "z";
        }
        if (qChange[largestChange] === 0) {
            return [[x2, y2, z2]];
        }
        var largestTarget = Math.max(dy, dx, dz);
        var startAxis = largestChange === "y" ? y1 : largestChange === "x" ? x1 : z1;
        var x = x1;
        var y = y1;
        var z = z1;
        var points = [];
        var rx = 0;
        var ry = 0;
        var rz = 0;
        for (var i = startAxis; qChange[largestChange] === 1 ? i <= startAxis + largestTarget : i >= startAxis - largestTarget; i += qChange[largestChange]) {
            if (largestChange === "x") {
                if (ry >= dx) {
                    ry -= dx;
                    y += qChange["y"];
                }
                if (rz >= dx) {
                    rz -= dx;
                    z += qChange["z"];
                }
                ry += dy;
                rz += dz;
                points.push([i, y, z]);
                continue;
            }
            if (largestChange === "y") {
                if (rx >= dy) {
                    rx -= dy;
                    x += qChange["x"];
                }
                if (rz >= dy) {
                    rz -= dy;
                    z += qChange["z"];
                }
                rx += dx;
                rz += dz;
                points.push([x, i, z]);
                continue;
            }
            if (largestChange === "z") {
                if (rx >= dz) {
                    rx -= dz;
                    x += qChange["x"];
                }
                if (ry >= dz) {
                    ry -= dz;
                    y += qChange["y"];
                }
                ry += dy;
                rx += dx;
                points.push([x, y, i]);
                continue;
            }
        }
        return points;
    };
    return BaseObject;
}());
exports.BaseObject = BaseObject;
/**
 * Used for {@link Line.generateLine} to decide how the line should be generated.
 *
 * A single pass will generate the line from start to end via {@link BaseObject.graph3DParametric}, and set the fill voxels
 *
 * Double pass will generate from start to end, and then end to start. It will combine both lines into one and set the fill voxels.
 *
 * For more information, see {@link BaseObject.graph3DParametric}
 */
var LineTypes;
(function (LineTypes) {
    LineTypes["SINGLE_PASS_LINE"] = "SINGLE_PASS_LINE";
    LineTypes["DOUBLE_PASS_LINE"] = "DOUBLE_PASS_LINE";
})(LineTypes || (LineTypes = {}));
/**
 * Contains all of the data structures to generate a 3D line between two points in 3D space.
 *
 * @remarks
 *
 * Related:
 *
 * {@link BaseObject.graph3DParametric}
 *
 * {@link BaseObject}
 *
 * {@link LineTypes}
 *
 * {@link LineOptions}
 */
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line(options) {
        var _this = _super.call(this, {
            controller: options.controller,
            origin: options.origin
        }) || this;
        _this.controller.setReferenceEntry(_this.uuid, _this);
        _this._endPoints = BaseObject.deepCopy(options.endPoints);
        _this._fillVoxels = __spreadArray([], _this._endPoints, true);
        _this.calculateBoundingBox();
        return _this;
    }
    /**
     * Generates the line between the {@link Line._endPoints}.
     * The outputted {@link Line._fillVoxels} are sorted by the first, second, and then third smallest axes order.
     * @param mode See {@link LineTypes} for more information.
     */
    Line.prototype.generateLine = function (mode) {
        var biggestRangeIndex = this.boundingBox.biggestRangeIndex;
        var startToEnd = BaseObject.graph3DParametric.apply(BaseObject, __spreadArray(__spreadArray([], this._endPoints[0], false), this._endPoints[1], false));
        if (mode === LineTypes.DOUBLE_PASS_LINE) {
            var endToStart = BaseObject.graph3DParametric.apply(BaseObject, __spreadArray(__spreadArray([], this._endPoints[1], false), this._endPoints[0], false)).reverse();
            // pushes to fill voxels
            for (var j = 0; j < endToStart.length; j++) {
                // If a item parrel to 
                if (JSON.stringify(endToStart[j]) !== JSON.stringify(startToEnd[j])) {
                    this._fillVoxels.push(endToStart[j]);
                }
                this._fillVoxels[j];
            }
        }
        else {
            BaseObject.push2D(startToEnd, this._fillVoxels);
        }
        this._fillVoxels = this._fillVoxels
            .sort(function (a, b) { return a[biggestRangeIndex[0]] - b[biggestRangeIndex[0]]; })
            .sort(function (a, b) { return a[biggestRangeIndex[1]] - b[biggestRangeIndex[1]]; })
            .sort(function (a, b) { return a[biggestRangeIndex[2]] - b[biggestRangeIndex[2]]; });
        this.calculateBoundingBox();
    };
    /**
     * @returns The {@link Line._endPoints} with each {@link Line._origin} added to them via {@link BaseObject.addOrigin}.
     */
    Line.prototype.getVerticeVoxels = function () {
        return BaseObject.addOrigin(this._endPoints, this._origin);
    };
    /**
     * Changes the current {@link Line._endPoints}, set them as the {@link Line._fillVoxels}, calculautes required bounding box data.
     * @param endPoints New End Points [start, end]
     */
    Line.prototype.changeEndPoints = function (endPoints) {
        this._endPoints = [endPoints[0], endPoints[1]];
        this._fillVoxels = __spreadArray([], this._endPoints, true);
        this.calculateBoundingBox();
    };
    return Line;
}(BaseObject));
/**
 * Stores data structures required to create a 3D polygon in 3D space.
 */
var Layer = /** @class */ (function (_super) {
    __extends(Layer, _super);
    function Layer(options) {
        var _this = _super.call(this, {
            controller: options.controller,
            origin: options.origin
        }) || this;
        _this.controller.setReferenceEntry(_this.uuid, _this);
        _this._verticesArray = BaseObject.deepCopy(options.verticesArray);
        _this._fillVoxels = __spreadArray([], _this._verticesArray, true);
        _this.calculateBoundingBox();
        _this.edgeDirectory = {};
        return _this;
    }
    /**
     * Changes the shapes vertices.
     *
     * @remarks
     * Changes fill voxels to the vertices, resets the edge directory, calculates bounding boxes.
     *
     * @param verticesArray The new set of vertices
     */
    Layer.prototype.changeVertices = function (verticesArray) {
        this._verticesArray = BaseObject.deepCopy(verticesArray);
        this._fillVoxels = __spreadArray([], this._verticesArray, true);
        this.calculateBoundingBox();
        this.edgeDirectory = {};
    };
    /**
     * Generates the entries of {@link Layer.edgeDirectory}, where each entry is a line that connects one vertice to another.
     *
     * Use {@link Layer.getEdgeVoxels} to acess all edge voxels as a single array.
     *
     * Also adds all voxels from the edge directory to the {@link Layer._fillVoxels}.
     */
    Layer.prototype.generateEdges = function () {
        this._fillVoxels = [];
        var tempLine = new Line({
            endPoints: [[0, 0, 0], [0, 0, 0]],
            controller: this.controller,
            origin: this.getOrigin()
        });
        this.edgeDirectory = {};
        // If this shape has more then 1 vertice
        if (this._verticesArray.length > 1) {
            // Loop through all the vertices
            for (var i = 0; i < this._verticesArray.length; i++) {
                // If we are at the last vertices in the list, draw back to the first one.
                var startIndex = i;
                var endIndex = void 0;
                if (i + 1 === this._verticesArray.length) {
                    endIndex = 0;
                }
                else {
                    endIndex = i + 1;
                }
                var entryKey = "V".concat(startIndex, "V").concat(endIndex);
                /*
                   Since we are using a rasterization,
                   drawing a line from two given points will results in different values
                   depending on if you go from start to end or end to start order
                   A double sided line is used.
                */
                tempLine.changeEndPoints([this._verticesArray[startIndex], this._verticesArray[endIndex]]);
                tempLine.generateLine(LineTypes.DOUBLE_PASS_LINE);
                var lineFillVoxels = tempLine.getFillVoxels();
                this.edgeDirectory[entryKey] = lineFillVoxels;
                BaseObject.push2D(this.edgeDirectory[entryKey].slice(1, lineFillVoxels.length - 1), this._fillVoxels);
            }
        }
        else {
            this.edgeDirectory["V0V0"] = [__spreadArray([], this._verticesArray[0], true)];
            this._fillVoxels.push(__spreadArray([], this._verticesArray[0], true));
        }
        BaseObject.push2D(this._verticesArray, this._fillVoxels);
        tempLine.controller.removeReferenceEntry(this.uuid);
        tempLine.controller.removeID(this.uuid);
        this.calculateBoundingBox();
    };
    /**
     * Uses the {@link Layer.sortedFillVoxelsDirectory} generated from the {@link Layer._fillVoxels} generated from {@link Layer.generateEdges} to fill in the shape.
     *
     * Sets {@link Layer._fillVoxels} and calculautes bounding box.
     */
    Layer.prototype.fillPolygon = function () {
        this._fillVoxels = [];
        var temporary2DSlice = new Layer({
            verticesArray: [[0, 0, 0]],
            origin: this.getOrigin(),
            controller: this.controller
        });
        for (var _i = 0, _b = Object.keys(this.sortedFillVoxelsDirectory); _i < _b.length; _i++) {
            var entry = _b[_i];
            var currentEntry = Number(entry);
            var entryVoxels = this.sortedFillVoxelsDirectory[currentEntry];
            temporary2DSlice.changeVertices(entryVoxels);
            temporary2DSlice.generateEdges();
            BaseObject.push2D(temporary2DSlice.getFillVoxels(), this._fillVoxels);
        }
        this.calculateBoundingBox();
    };
    /**
     * Compiles the {@link Layer.edgeDirectory} into a single 2D array
     * @returns Array of all voxels that make up the shape.
     */
    Layer.prototype.getEdgeVoxels = function () {
        var output = [];
        for (var _i = 0, _b = Object.entries(this.edgeDirectory); _i < _b.length; _i++) {
            var _c = _b[_i], edge = _c[0], array = _c[1];
            for (var _d = 0, _e = Object.entries(this.edgeDirectory[edge]); _d < _e.length; _d++) {
                var _f = _e[_d], index = _f[0], voxel = _f[1];
                output.push([voxel[0] + this._origin[0], voxel[1] + this._origin[1], voxel[2] + this._origin[2]]);
            }
        }
        return output;
    };
    /**
     * @returns the {@link Layer._verticesArray}, accounts for origin and is mutation free.
     */
    Layer.prototype.getVerticeVoxels = function () {
        return BaseObject.addOrigin(this._verticesArray, this._origin);
    };
    return Layer;
}(BaseObject));
