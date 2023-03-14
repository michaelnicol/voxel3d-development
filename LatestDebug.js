/**
   * @remarks
   * Specifies the various modes of how data is retrieved for {@link JointBoundingBox.getAllJointBoundingBoxes}
   */
export var JointBoundingBoxActions;
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
})(JointBoundingBoxActions || (JointBoundingBoxActions = {}));
/**
 * Holds an array of one or more {@link BoundingBox}, and treats them as one box.
 *
 * @remarks
 * When a single box is used to outline the entire 3D space a shape takes up, large voids may appear. For example, encasing a diagonal line in a sqaure leaves mostly empty space.
 *
 * Instead, slice the line into smaller pieces and encase each slice in its own box. Then put all of those slices in a single data structure that treats it as one continuous space boundary.
 */
export class JointBoundingBox {
   boundingBoxes = [];
   constructor(boxes) {
      this.boundingBoxes = boxes;
   }
   /**
    * Decides if a given point is in any of the internally stored boxes
    * @param point XYZ Value
    * @returns True if inside, false if it is not.
    */
   isInside (point) {
      if (this.boundingBoxes.length === 0) {
         return false;
      }
      for (let i = 0; i < this.boundingBoxes.length; i++) {
         if (BoundingBox.isInside(point, this.boundingBoxes[i].boundingBoxPointData)) {
            return true;
         }
      }
      return false;
   }
   /**
    * @param mode A mode from JointBoundingBoxActions
    * @returns An array of data about each of the {@link JointBoundingBox.boundingBoxes}
    */
   getAllJointBoundingBoxes (mode) {
      return this.boundingBoxes.reduce((prev, curr) => {
         if (mode === JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY) {
            return prev.push(JSON.parse(JSON.stringify(curr))), prev;
         }
         else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS_DIRECTORY) {
            return prev.push(JSON.parse(JSON.stringify(curr.boundingBoxPointData))), prev;
         }
         else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS) {
            return prev.push(...BoundingBox.compileBoundingDirectory(curr.boundingBoxPointData)), prev;
         }
         else {
            throw new TypeError("Invalid Mode");
         }
      }, []);
   }
}
/**
 * Specifies the input payload type for {@link BoundingBox}
 */
export var BoundingBoxPayloadModes;
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
})(BoundingBoxPayloadModes || (BoundingBoxPayloadModes = {}));
export class BoundingBox {
   static BOX_VERTICE_COUNT = 8;
   /**
    * Stores the XYZ corner data of all eight vertices of the current bounding box.
    *
    * Each vertice has a unique position define as [Front|Back],[Right|Left],[Top|Bottom]
    *
    * 0 = Front Left Bottom (FLB): [0,0,0]
    *
    * 1 = Front Right Bottom (FRB): [1,0,0]
    *
    * 2 = Front Left Top (FLT): [0,1,0]
    *
    * 3 = Front Right Top (FRT): [1,1,0]
    *
    * 4 = Back Left Bottom (BLB): [0,0,1]
    *
    * 5 = Back Right Bottom (BRB): [1,0,1]
    *
    * 6 = Back Left Top (BLT): [0,1,1]
    *
    * 7 = Back Top Right (BTR): [1,1,1]
    */
   boundingBoxPointData = {
      "0": [0, 0, 0],
      "1": [0, 0, 0],
      "2": [0, 0, 0],
      "3": [0, 0, 0],
      "4": [0, 0, 0],
      "5": [0, 0, 0],
      "6": [0, 0, 0],
      "7": [0, 0, 0],
   };
   /**
    * The coordinate of the lowest Y value that the current {@link BoundingBox.boundingBox} contains.
    */
   yLow = -1;
   /**
    * The coordinate of the highest Y value that the current {@link BoundingBox.boundingBox} contains.
    */
   yHigh = -1;
   /**
    * The coordinate of the lowest X value that the current {@link BoundingBox.boundingBox} contains.
    */
   xLow = -1;
   /**
    * The coordinate of the highest X value that the current {@link BoundingBox.boundingBox} contains.
    */
   xHigh = -1;
   /**
    * The coordinate of the lowest Z value that the current {@link BoundingBox.boundingBox} contains.
    */
   zLow = -1;
   /**
    * The coordinate of the highest Z value that the current {@link BoundingBox.boundingBox} contains.
    */
   zHigh = -1;
   /**
    * The distance between the xLow and xHigh (abs)
    */
   xRange = -1;
   /**
    * The distance between the yLow and yHigh (abs)
    */
   yRange = -1;
   /**
    * The distance between the zLow and zHigh (abs)
    */
   zRange = -1;
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
   biggestRangeLabaled = [];
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
   biggestRangeIndex = [];
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
   biggestRangeLabaledLow = [];
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
   biggestRangeLabaledHigh = [];
   /**
    * @remarks
    * Automatically calls {@link BoundingBox.calculateRange} to generate all required metadata.
    * @param options
    */
   constructor(options) {
      if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_DIRECTORY) {
         this.setBoundingBox(options.boundingInputPayload);
      }
      else if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS) {
         this.createBoundingBox(options.boundingInputPayload);
      }
   }
   static getEmptyBoundingTemplate () {
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
   }
   /**
    * @remarks
    * Copies the passed in bounding box as the new internally stored box (mutation free), recalculates all required range metadata via {@link BoundingBox.calculateRange}
    * @param boundingBoxStructure
    */
   setBoundingBox (boundingBoxStructure) {
      for (let i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
         let key = String(i);
         this.boundingBoxPointData[key] = [...boundingBoxStructure[key]];
      }
      this.calculateRange(BoundingBox.compileBoundingDirectory(boundingBoxStructure));
   }
   /**
    * Checks if a given point falls within the 3D space this box covers.
    * @param arr The given XYZ Point
    * @param b2 The bounding box to check
    * @returns True if inside, false if not.
    */
   static isInside (arr, b2) {
      return (arr[0] >= b2[0][0] &&
         arr[0] <= b2[1][0] &&
         arr[1] >= b2[0][1] &&
         arr[1] <= b2[2][1] &&
         arr[2] >= b2[0][2] &&
         arr[2] <= b2[4][2]);
   }
   /**
    * @remarks
    * Used by {@link JointBoundingBox}
    * @param b3 The Bounding Box corner directory
    * @returns An array of all of the corner voxels.
    */
   static compileBoundingDirectory (b3) {
      let voxels = [];
      for (let i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
         let key = String(i);
         if (b3[key].length === 3) {
            voxels.push([...b3[key]]);
         }
      }
      return voxels;
   }
   /**
    * Calculates all of the metadata based for the current {@link BoundingBox.boundingBox}. This includes the point extremes and ranges on all three axes.
    * @param array2D
    */
   calculateRange (array2D) {
      let xValues = array2D.reduce((prev, curr) => { return prev.push(curr[0]), prev; }, []).sort((a, b) => a - b);
      let yValues = array2D.reduce((prev, curr) => { return prev.push(curr[1]), prev; }, []).sort((a, b) => a - b);
      let zValues = array2D.reduce((prev, curr) => { return prev.push(curr[2]), prev; }, []).sort((a, b) => a - b);
      this.xLow = xValues[0];
      this.xHigh = xValues[xValues.length - 1];
      this.yLow = yValues[0];
      this.yHigh = yValues[yValues.length - 1];
      this.zLow = zValues[0];
      this.zHigh = zValues[zValues.length - 1];
      this.zRange = Math.abs(this.zHigh - this.zLow);
      this.yRange = Math.abs(this.yHigh - this.yLow);
      this.xRange = Math.abs(this.xHigh - this.xLow);
      const rangeKey = {
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
      this.biggestRangeLabaled = ["xRange", "yRange", "zRange"].sort((a, b) => rangeKey[b].v - rangeKey[a].v);
      this.biggestRangeLabaledLow = this.biggestRangeLabaled.map(n => n.replace("Range", "Low"));
      this.biggestRangeLabaledHigh = this.biggestRangeLabaled.map(n => n.replace("Range", "High"));
      this.biggestRangeIndex = this.biggestRangeLabaled.map(n => rangeKey[n].i);
   }
   /**
    * Creates a new bounding box that encompasses a group of points. Stores internally as {@link BoundingBox.boundingBox}. Automatically calculates range via {@link BoundingBox.calculateRange}
    * @param array2D
    */
   createBoundingBox (array2D) {
      if (array2D.length > 0) {
         this.calculateRange(array2D);
         this.boundingBoxPointData[0] = [this.xLow, this.yLow, this.zLow];
         this.boundingBoxPointData[1] = [this.xHigh, this.yLow, this.zLow];
         this.boundingBoxPointData[2] = [this.xLow, this.yHigh, this.zLow];
         this.boundingBoxPointData[3] = [this.xHigh, this.yHigh, this.zLow];
         this.boundingBoxPointData[4] = [this.xLow, this.yLow, this.zHigh];
         this.boundingBoxPointData[5] = [this.xHigh, this.yLow, this.zHigh];
         this.boundingBoxPointData[6] = [this.xLow, this.yHigh, this.zHigh];
         this.boundingBoxPointData[7] = [this.xHigh, this.yHigh, this.zHigh];
      }
      else {
         throw new RangeError("Invalid BoundingBox.createBoundingBox argument: array2D must contain at least one XYZ voxel.");
      }
   }
   /**
    * Returns the amount of entries within a {@link PartialBoundingBoxPointData} that are valid {@link Voxel}, used by the {@link BoundingBox.correctBoundingBox} method.
    * @param b3 Bounding Box
    * @returns Count
    */
   static findEntryCount (b3) {
      let entryCount = 0;
      for (let i in b3) {
         if (b3[i].length > 0) {
            entryCount++;
         }
      }
      return entryCount;
   }
   /**
    * Check if a horizontal line from LP to RP, passes through a vertical plane defined by three corner points.
    *
    * The scheme for vertices is [Front|Back],[Right|Left],[Top|Bottom].
    *
    * The abbrivation of "FLoRB" signifies a [Front], [Right or Left], [Bottom point]. This is because the bounding box has two vertical planes
    * perpendicular to the x-axis, so the programmer can choose between the left or right plane.
    *
    * If one corner point is on the left plane, then all other corner points must also be left (and vice versa).
    *
    * @param LP Left Point
    * @param RP Right Point
    * @param FLoRB [Front], [Right or Left], [Bottom point]
    * @param FLoRT [Front], [Right or Left], [Top point]
    * @param BLoRT [Back],  [Right or Left], [Top point]
    * @returns true if this line passes through this plane, false otherwise.
    */
   static horizontalLineCheck (LP, RP, FLoRB, FLoRT, BLoRT) {
      return LP[0] <= FLoRB[0] &&
         RP[0] >= FLoRB[0] &&
         LP[1] >= FLoRB[1] &&
         LP[1] <= FLoRT[1] &&
         LP[1] >= FLoRB[1] &&
         LP[2] >= FLoRT[2] &&
         LP[2] <= BLoRT[2];
   }
   /**
    * Check if a vertical line from TP to BP, passes through a horizontal plane defined by three corner points.
    *
    * The scheme for vertices is [Front|Back],[Right|Left],[Top|Bottom].
    *
    * The abbrivation of "FLToB" signifies a [Front], [Left], [Top or Bottom]. This is because the bounding box has two horizontal planes
    * perpendicular to the y-axis, so the programmer can choose between the top or bottom plane.
    *
    * If one corner point is on the top plane, then all other corner points must also be top (and vice versa).
    *
    * @param TP Top Point
    * @param BP Bottom Point
    * @param FLToB [Front], [Left], [Top or Bottom]
    * @param BLToB [Back], [Left], [Top or Bottom]
    * @param FRToB [Front], [Right], [Top or Bottom]
    * @returns true if this line passes through this plane, false otherwise.
    */
   static verticalLineCheck (TP, BP, FLToB, BLToB, FRToB) {
      return TP[0] >= FLToB[0] &&
         TP[0] <= FRToB[0] &&
         TP[1] >= FLToB[1] &&
         BP[1] <= FLToB[1] &&
         TP[2] >= FLToB[2] &&
         TP[2] <= BLToB[2];
   }
   /**
    * Check if a horizontal line (From -Z to +Z) from FP to BP, passes through a Vertical (front or back) plane defined by three corner points.
    *
    * The scheme for vertices is [Front|Back],[Right|Left],[Top|Bottom].
    *
    * The abbrivation of "FoBLB" signifies a [Front or Back], [Left], [Bottom]. This is because the bounding box has a back and front plane
    * perpendicular to the z-axis, so the programmer can choose between the two.
    *
    * If one corner point is on the front plane, then all other corner points must also be front plane (and vice versa for back plane).
    *
    * @param FP Front Point
    * @param BP Back Point
    * @param FoBLB [Front or Back], [Left], [Bottom]
    * @param FoBRB [Front or Back], [Right], [Bottom]
    * @param FoBLT [Front or Back], [Left], [Top]
    * @returns true if this line passes through this plane, false otherwise.
    */
   static depthLineCheck (FP, BP, FoBLB, FoBRB, FoBLT) {
      return FP[0] <= FoBRB[0] &&
         FP[0] >= FoBLT[0] &&
         FP[1] <= FoBLT[1] &&
         FP[1] >= FoBLB[1] &&
         FP[2] <= FoBLB[2] &&
         BP[2] >= FoBLB[2];
   }
   /**
   * @remarks Defines the ordered pairs of vertices from a {@link BoundingBox.boundingBoxPointData} for use within the {@link BoundingBox.boundingBoxIntersect} method.
   *
   * The first array of pairs signify all of the horizontal edge pairs in left to right order.
   *
   * The second array of pairs signify all of the vertical edge pairs in bottom to top order.
   *
   * The third array of pairs signify all of the depth edge pairs from front to back order.
   *
   * These pairs represent the edges of intersecting boxes. If the vertice 0 to vertice 1 edge from one box passes through vertical perpendicular to x-axis planes of the intersecting box, then intersection points can be created.
   */
   static #VP = [
      [[0, 1], [2, 3], [6, 7], [4, 5]],
      [[0, 2], [1, 3], [4, 6], [5, 7]],
      [[2, 6], [3, 7], [0, 4], [1, 5]]
   ];
   /**
   * @remarks Generates a new {@link CompleteBoundingBoxPointData} or {@link PartialBoundingBoxPointData} from the intersection between two inputted boxes.
   *
   * Used to find the cubic range area that is shared between two boxes, if any.
   *
   * @param b1 Box 1
   * @param b2 Box 2
   * @returns Returns an array, and if the first element is true, then the second element is the intersection {@link CompleteBoundingBoxPointData}.
   *
   * Otherwise, the intersection is not possible (false) and the second element will be a {@link PartialBoundingBoxPointData}. This partial box will be the method's best attempt to {@link BoundingBox.correctBoundingBox}.
   */
   static boundingBoxIntersect (b1, b2) {
      const B3 = BoundingBox.getEmptyBoundingTemplate();
      // First, check if any of the horizontal edges from each box pass through each other.
      for (let XP of BoundingBox.#VP[0]) {
         // XP is [0,1] for example
         let LP1 = b1["" + XP[0]];
         let RP1 = b1["" + XP[1]];
         let LP2 = b2["" + XP[0]];
         let RP2 = b2["" + XP[1]];
         /**
          *  static horizontalLineCheck(LP, RP, FLoRB, FLoRT, BLoRT) {
          */
         let left_plane1 = BoundingBox.horizontalLineCheck(LP1, RP1, b2[0], b2[2], b2[6]);
         let right_plane1 = BoundingBox.horizontalLineCheck(LP1, RP1, b2[1], b2[3], b2[7]);
         let left_plane2 = BoundingBox.horizontalLineCheck(LP2, RP2, b1[0], b1[2], b1[6]);
         let right_plane2 = BoundingBox.horizontalLineCheck(LP2, RP2, b1[1], b1[3], b1[7]);
         if (left_plane1) {
            B3["" + XP[0]] = [b2[0][0], LP1[1], LP1[2]];
         }
         if (right_plane1) {
            B3["" + XP[1]] = [b2[1][0], RP1[1], RP1[2]];
         }
         if (left_plane2) {
            B3["" + XP[0]] = [b1[0][0], LP2[1], LP2[2]];
         }
         if (right_plane2) {
            B3["" + XP[1]] = [b1[1][0], RP2[1], RP2[2]];
         }
         if (BoundingBox.isInside(LP1, b2)) {
            B3["" + XP[0]] = [...LP1];
         }
         if (BoundingBox.isInside(RP1, b2)) {
            B3["" + XP[1]] = [...RP1];
         }
         if (BoundingBox.isInside(LP2, b1)) {
            B3["" + XP[0]] = [...LP2];
         }
         if (BoundingBox.isInside(RP2, b1)) {
            B3["" + XP[1]] = [...RP2];
         }
      }
      for (let YP of BoundingBox.#VP[1]) {
         // vp could be [0,2]
         let BP1 = b1["" + YP[0]];
         let TP1 = b1["" + YP[1]];
         let BP2 = b2["" + YP[0]];
         let TP2 = b2["" + YP[1]];
         // static verticalLineCheck(TP, BP, FLToB, BLToB, FRToB) {
         let top_plane1 = BoundingBox.verticalLineCheck(TP1, BP1, b2[2], b2[6], b2[3]);
         let bottom_plane1 = BoundingBox.verticalLineCheck(TP1, BP1, b2[0], b2[4], b2[5]);
         let top_plane2 = BoundingBox.verticalLineCheck(TP2, BP2, b1[2], b1[6], b1[3]);
         let bottom_plane2 = BoundingBox.verticalLineCheck(TP2, BP2, b1[0], b1[4], b1[5]);
         if (top_plane1) {
            B3["" + YP[1]] = [TP1[0], b2[2][1], TP1[2]];
         }
         if (bottom_plane1) {
            B3["" + YP[0]] = [BP1[0], b2[0][1], BP1[2]];
         }
         if (top_plane2) {
            B3["" + YP[1]] = [TP2[0], b1[2][1], TP2[2]];
         }
         if (bottom_plane2) {
            B3["" + YP[0]] = [BP2[0], b1[0][1], BP2[2]];
         }
         if (BoundingBox.isInside(BP1, b2)) {
            B3["" + YP[0]] = [...BP1];
         }
         if (BoundingBox.isInside(TP1, b2)) {
            B3["" + YP[1]] = [...TP1];
         }
         if (BoundingBox.isInside(BP2, b1)) {
            B3["" + YP[0]] = [...BP2];
         }
         if (BoundingBox.isInside(TP2, b1)) {
            B3["" + YP[1]] = [...TP2];
         }
      }
      for (let ZP of BoundingBox.#VP[2]) {
         // FRONT TO BACK
         let FP1 = b1["" + ZP[0]];
         let BP1 = b1["" + ZP[1]];
         let FP2 = b2["" + ZP[0]];
         let BP2 = b2["" + ZP[1]];
         // (method) BoundingBox.depthLineCheck(FP: any, BP: any, FoBLB: any, FoBRB: any, FoBLT: any): boolean
         let back_plane1 = BoundingBox.depthLineCheck(FP1, BP1, b2[4], b2[5], b2[6]);
         let forward_plane1 = BoundingBox.depthLineCheck(FP1, BP1, b2[0], b2[1], b2[2]);
         let back_plane2 = BoundingBox.depthLineCheck(FP2, BP2, b1[4], b1[5], b1[6]);
         let forward_plane2 = BoundingBox.depthLineCheck(FP2, BP2, b1[0], b1[1], b1[2]);
         if (back_plane1) {
            B3["" + ZP[1]] = [BP1[0], BP1[1], b2[4][2]];
         }
         if (forward_plane1) {
            B3["" + ZP[0]] = [FP1[0], FP1[1], b2[0][2]];
         }
         if (back_plane2) {
            B3["" + ZP[1]] = [BP2[0], BP2[1], b1[4][2]];
         }
         if (forward_plane2) {
            B3["" + ZP[0]] = [FP2[0], FP2[1], b1[0][2]];
         }
         if (BoundingBox.isInside(BP1, b2)) {
            B3["" + ZP[1]] = [...BP1];
         }
         if (BoundingBox.isInside(FP1, b2)) {
            B3["" + ZP[0]] = [...FP1];
         }
         if (BoundingBox.isInside(BP2, b1)) {
            B3["" + ZP[1]] = [...BP2];
         }
         if (BoundingBox.isInside(FP2, b1)) {
            B3["" + ZP[0]] = [...FP2];
         }
      }
      return this.correctBoundingBox(B3);
   }
   /**
    * Checks if all of the given vertice numbers are defined within {@link BoundingBox.boundingBox} b3 (valid {@link Voxel}).
    *
    * @remarks Used internally by {@link BoundingBox.correctBoundingBox}. Can also be used to tell if a given {@link PartialBoundingBoxPointData} can be casted to a {@link CompleteBoundingBoxPointData}
    *
    * @param b3
    * @param args List of vertices to check if all are defined
    * @returns True if all are defined, false otherwise.
    */
   static isDef = (b3, args) => {
      for (let i = 0; i < args.length; i++) {
         if (b3[args[i] + ""].length === 0) {
            return false;
         }
      }
      return true;
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
   static correctBoundingBox (b3) {
      let entryCount = BoundingBox.findEntryCount(b3);
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
   }
}
/**
 * A controller for all of the universally unique identifications within the program. Contains a database where objects can choose to attatch a reference for each ID.
 *
 * @remarks
 *
 * @todo - redo
 */
export class UUIDController {
   /**
    * A database where the key is the UUID, and the object is the reference in memory.
    */
   _objIDReferance;
   /**
    * A list of all UUID's managed by this controller
    */
   #arrID;
   constructor() {
      this.#arrID = [];
      this._objIDReferance = {};
   }
   /**
    *
    * @returns A random unicode character between either 47 to 57 decimal (U+0030 - U+0039) or 97 to 122 (U+0061 - U+007A)
    */
   randomChar () {
      let choice = Math.random() > 0.5;
      return String.fromCodePoint(Math.floor(Math.random() * (choice ? 26 : 10) + (choice ? 97 : 48)));
   }
   /**
    * Generates a new 36 character UUID
    *
    * @remarks Does not check if this UUID is already within {@link UUIDController.#arrID} nor does it add it to the list.
    *
    * @returns UUID
    */
   #generateID () {
      let uuid = "";
      for (let i = 1; i < 37; i++) {
         uuid += this.randomChar();
      }
      return uuid;
   }
   /**
    * Adds a new reference to the {@link UUIDController._objIDReferance} database.
    * @param id The UUID
    * @param reference Object reference
    */
   setReferenceEntry (id, reference) {
      this._objIDReferance[id] = reference;
   }
   /**
    * Removes the key/value pair via delete within the {@link UUIDController._objIDReferance} database.
    *
    * @example
    *  delete this._objIDReferance[id]
    *
    * @param id Target key via UUID
    */
   removeReferenceEntry (id) {
      delete this._objIDReferance[id];
   }
   /**
    * Generates a new 36 character UUID and is added to {@link UUIDController.#arrID}.
    *
    * @returns A new UUID
    */
   getNewID () {
      let id = this.#generateID();
      while (this.#arrID.indexOf(id) !== -1) {
         id = this.#generateID();
      }
      this.#arrID.push(id);
      return id;
   }
   /**
    * Removes the UUID from the controller's memory
    * @param id UUID to remove
    * @returns A mutation free copy of all of the ID's
    */
   removeID (id) {
      this.#arrID = this.#arrID.filter(n => id !== n);
      delete this._objIDReferance[id];
      return [...this.#arrID];
   }
   /**
    * @returns A mutation free copy of all of the ID's
    */
   getAllID () {
      return [...this.#arrID];
   }
   /**
    * @param id UUID to add
    * @returns True if this ID could be added, false if it was a duplicate and could not be added.
    */
   addID (id) {
      if (this.#arrID.indexOf(id) === -1) {
         this.#arrID.push(id);
         return true;
      }
      return false;
   }
   /**
    * Resets all stored ID's and references within this controller
    */
   delete () {
      this.#arrID = [];
      this._objIDReferance = {};
   }
}
/**
 * A BaseObject holds the most basic data structures required to construct a 3D tesselated shape.
 *
 * @todo Add sorting methods
 *
 * @remarks
 * See the instance attributes for the baseline requirements to be considered a shape.
 */
export class BaseObject {
   controller;
   /**
    * UUID sourced by an {@link UUIDController} instance. The UUID is used by <Insert future composite class here> for caching composite operations.
    */
   uuid;
   /**
    * Array of {@link Voxel} that represent all of the voxels that make up this shape.
    *
    * @remarks
    * 1) This directory is not internally private because it may be millions of voxels in length and a programmer may want to access the array without creating a copy.
    * 2) Voxels stored within this array do not account for the origin. {@link BaseObject.getFillVoxels} will return a mutation free copy of the fill voxels with origin accounted for.
    * 3) Default is [[0,0,0]] for constructor. All other inital instance attributes are based around this.
    * 4) Everytime the shapes fill voxels or origin are changed, {@link BaseObject.calculateBoundingBox} must be called. This is automatically done by default sub classes such as {@link Line}.
    */
   _fillVoxels;
   /**
    * A XYZ offset of the shape.
    *
    * @remarks
    * This allows the shape to be moved around without recalculating all of the {@link BaseObject._fillVoxels}.
    */
   _origin;
   /**
    * A {@link JointBoundingBox} that combines each entry from {@link BaseObject.sortedFillVoxelsDirectory} into one box.
    *
    * @remarks
    * Returned from {@link BaseObject.sortFillVoxels}, Accounts for origin.
    */
   jointBoundingBox;
   /**
    * A single {@link BoundingBox} that emcompasses the entire {@link BaseObject._fillVoxels}.
    *
    * If the their are no voxels to surrond, it comes a empty Bounding Box {@link ZeroVolumeBoundingBoxPointData}. This type mimics a bounding box, but contains no corner voxels or range data.
    *
    * Without these zero voxel type, the {@link BaseObject} could never represent a shape with no Voxels,
    * which would be a would be a issue with representing a shape the is composed as the mathematical intersection between two shapes that do not intersect.
    *
    * @remarks
    * Accounts for origin.
    */
   boundingBoxMeta;
   /**
    * Catagorizes a group of voxels into a directory where the key is the value of the largest axes from the {@link BoundingBox}. The value is all voxels with that coordinate value.
    *
    * @remarks
    * Returned from {@link BaseObject.sortFillVoxels}, Accounts for origin.
   */
   sortedFillVoxelsDirectory;
   constructor(options) {
      this.controller = options.controller;
      this.uuid = options.controller.getNewID();
      // Inital value
      this._fillVoxels = [[0, 0, 0]];
      this._origin = [...options.origin];
      this.boundingBoxMeta = new BoundingBox({
         boundingInputPayload: BaseObject.addOrigin(this._fillVoxels, this._origin),
         inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS
      });
      let output = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBoxMeta);
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
   static addOrigin (arr, o) {
      return arr.reduce((prev, curr) => {
         return prev.push([curr[0] + o[0], curr[1] + o[1], curr[2] + o[2]]), prev;
      }, []);
   }
   /**
    * Getter method.
    *
    * @returns Mutation free copy of the shape origin.
    */
   getOrigin () {
      return [...this._origin];
   }
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
   getFillVoxels () {
      return BaseObject.addOrigin(this._fillVoxels, this.getOrigin());
   }
   /**
    * Since the {@link BaseObject.boundingBox}, {@link BaseObject.sortedFillVoxelsDirectory}, and {@link BaseObject.jointBoundingBox} are all based on the current {@link BaseObject._fillVoxels}, a change to the fill voxels or origin will now make these directories wrong.
    *
    * Each time the fill voxels or origin are changed, this method must be called. Any built in subclass of {@link BaseObject} that changes fill voxels, such as {@link Line.generateLine}, will automatically call this method.
    *
    * {@link BaseObject.sortFillVoxels} can only accept a BoundingBox and more than one Voxel. As a result, we cannot run that function when the object has no voxels.
    *
    * As a result, running this function when you have no voxels will result in creating a {@link ZeroVolumeBoundingBoxPointData}, an empty {@link JointBoundingBox}, and an empty {@link BaseObject.sortedFillVoxelsDirectory}
   */
   calculateBoundingBox () {
      this.sortedFillVoxelsDirectory = {};
      if (this._fillVoxels.length === 0) {
         this.boundingBoxMeta = BoundingBox.getEmptyBoundingTemplate();
         this.jointBoundingBox = new JointBoundingBox([]);
      }
      else {
         this.boundingBoxMeta = new BoundingBox({
            inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
            boundingInputPayload: this.getFillVoxels()
         });
         let output = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBoxMeta);
         this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory;
         this.jointBoundingBox = output.jointBoundingBox;
      }
   }
   /**
    * Changes the current shapes origin and calls {@link BaseObject.calculateBoundingBox}
    * @param o New Origin
    *
    * @example
    * // Source code
    * setOrigin(o: Voxel): void {
    *  this._origin = [...o]
    *  this.calculateBoundingBox()
    * }
    */
   setOrigin (o) {
      this._origin = [...o];
      this.calculateBoundingBox();
   }
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
   static sortFillVoxels (inputVoxels, InputBoundingObject) {
      let sortedFillVoxelsDirectory = {};
      let sliceBoundingBoxDirectory = [];
      if (inputVoxels.length === 0) {
         return {
            jointBoundingBox: new JointBoundingBox([]),
            sortedFillVoxelsDirectory
         };
      }
      const { biggestRangeIndex, biggestRangeLabaledHigh, biggestRangeLabaledLow } = InputBoundingObject;
      for (let i = InputBoundingObject[biggestRangeLabaledLow[0]]; i <= InputBoundingObject[biggestRangeLabaledHigh[0]]; i++) {
         sortedFillVoxelsDirectory[i] = [];
      }
      for (let i = 0; i < inputVoxels.length; i++) {
         let voxel = inputVoxels[i];
         sortedFillVoxelsDirectory[voxel[biggestRangeIndex[0]]].push([...voxel]);
      }
      for (let key of Object.keys(sortedFillVoxelsDirectory)) {
         let fillKey = Number(key);
         // All points are sorted such that a binary search can be preformed on them.
         BaseObject.sortPoints(sortedFillVoxelsDirectory[fillKey])
         if (sortedFillVoxelsDirectory[fillKey].length >= 1) {
            sliceBoundingBoxDirectory.push(new BoundingBox({
               inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
               boundingInputPayload: sortedFillVoxelsDirectory[fillKey]
            }));
         }
      }
      return {
         jointBoundingBox: new JointBoundingBox(sliceBoundingBoxDirectory),
         sortedFillVoxelsDirectory
      };
   }
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
   static graph3DParametric = (x1, y1, z1, x2, y2, z2) => {
      let dy = y2 - y1;
      let dx = x2 - x1;
      let dz = z2 - z1;
      let qChange = {
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
      let largestChange;
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
      let largestTarget = Math.max(dy, dx, dz);
      let startAxis = largestChange === "y" ? y1 : largestChange === "x" ? x1 : z1;
      let x = x1;
      let y = y1;
      let z = z1;
      let points = [];
      let rx = 0;
      let ry = 0;
      let rz = 0;
      for (let i = startAxis; qChange[largestChange] === 1 ? i <= startAxis + largestTarget : i >= startAxis - largestTarget; i += qChange[largestChange]) {
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
   static compare2d (a1, a2) {
      if (a1.length !== a2.length) {
         return false;
      }
      if (Array.isArray(a1) && Array.isArray(a2)) {
         for (let i = 0; i < a1.length; i++) {
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
   }
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
   static push2D (from, to) {
      for (let n of from) {
         to.push([...n]);
      }
      return to;
   }
   static deepCopy (object) {
      return JSON.parse(JSON.stringify(object));
   }
   /**
    * Removes this object from the controllers reference database, wipes the fillVoxels and removes the ID.
    *
    * Doing this allows for JS automatic garabage collection to automatically remove this object from memory.
    *
    * However, this relies on the user not referencing the object after the delete is called.
    */
   delete () {
      this.controller.removeID(this.uuid);
      this._fillVoxels = [];
      this.calculateBoundingBox();
      this.uuid = "";
   }
   static sortPoints (arr) {
      return arr.sort((a, b) => a[2] - b[2]).sort((a, b) => a[1] - b[1]).sort((a, b) => a[0] - b[0])
   }
   findPointFromObject (point) {
      console.log(" ---------- Finding Point: "+JSON.stringify(point)+" --------- ")
      console.log(this)
      if (this._fillVoxels.length === 0) {
         console.log("Length Is Zero")
         return -1;
      }
      console.log("Range Index: "+JSON.stringify(this.boundingBoxMeta.biggestRangeIndex))
      let targetKey = point[this.boundingBoxMeta.biggestRangeIndex[0]]
      console.log("targetKey: "+targetKey)
      console.log('Directory: '+JSON.stringify(this.sortedFillVoxelsDirectory))
      if (Object.keys(this.sortedFillVoxelsDirectory).indexOf("" + targetKey)  === -1) {
         console.log("-> No Target Key")
         return -1;
      }
      let targetSortedEntry = this.sortedFillVoxelsDirectory[targetKey];
      console.log("targetKey: "+targetKey)
      console.log("TargetEntry: "+JSON.stringify(targetSortedEntry))
      return BaseObject.#pointBinarySearch(targetSortedEntry, 0, Math.floor((targetSortedEntry.length - 1) / 2), targetSortedEntry.length - 1, point, 0);
   }
   static findPointFromArray (arr, point) {
      return BaseObject.#pointBinarySearch(BaseObject.sortPoints(arr), 0, Math.floor((arr.length - 1) / 2), arr.length - 1, point, 0);
   }
   static #pointBinarySearch (arr, low, mid, high, targetCoord, targetIndex) {
      // console.log("\n\n\nLow: "+low);
      // console.log("Mid: "+mid);
      // console.log("High: "+high);
      // console.log("targetCoord: "+JSON.stringify(targetCoord))
      // console.log("targetIndex: "+JSON.stringify(targetIndex))
      if (low > high || !(JSON.stringify([...arr[mid]].splice(0, targetIndex)) 
      === JSON.stringify([...targetCoord].splice(0, targetIndex))) || arr.length === 0) {
         return -1;
      }
      // console.log("Mid: "+JSON.stringify(arr[mid]))
      // console.log("Arr: "+arr[mid][targetIndex])
      // console.log("Coord: "+targetCoord[targetIndex] )
      if (arr[mid][targetIndex] === targetCoord[targetIndex]) {
            // console.log("Activated IF STATEMENT")
         if (targetIndex === 2) {
            return mid;
         }
         else {
            // console.log("Incrementing Target")
            targetIndex += 1;
            return this.#pointBinarySearch(arr, low, mid, high, targetCoord, targetIndex);
         }
      }
      if (arr[mid][targetIndex] < targetCoord[targetIndex]) {
         low = mid + 1;
         mid = low + Math.floor((high - low) / 2);
         return this.#pointBinarySearch(arr, low, mid, high, targetCoord, targetIndex);
      }
      if (arr[mid][targetIndex] > targetCoord[targetIndex]) {
         high = mid - 1;
         mid = low + Math.floor((high - low) / 2);
         return this.#pointBinarySearch(arr, low, mid, high, targetCoord, targetIndex);
      }
      throw new TypeError("Binary Search Hit Lost End Conditation");
   }


}
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
 *
 * {@link LineOptions}
 */
export class Line extends BaseObject {
   /**
    * Stored the inputted endPoints. Does not account for origin.
    */
   _endPoints;
   constructor(options) {
      super({
         controller: options.controller,
         origin: options.origin,
      });
      this.controller.setReferenceEntry(this.uuid, this);
      this._endPoints = BaseObject.deepCopy(options.endPoints);
      this._fillVoxels = [...this._endPoints];
      this.calculateBoundingBox();
   }
   /**
    * Generates the line between the {@link Line._endPoints}.
    * The outputted {@link Line._fillVoxels} are sorted by the first, second, and then third smallest axes order.
    */
   generateLine () {
      this._fillVoxels = [];
      const { biggestRangeIndex } = this.boundingBoxMeta;
      let startToEnd = BaseObject.graph3DParametric(...this._endPoints[0], ...this._endPoints[1]);
      BaseObject.push2D(startToEnd, this._fillVoxels);
      this._fillVoxels = this._fillVoxels
         .sort((a, b) => a[biggestRangeIndex[2]] - b[biggestRangeIndex[2]])
         .sort((a, b) => a[biggestRangeIndex[1]] - b[biggestRangeIndex[1]])
         .sort((a, b) => a[biggestRangeIndex[0]] - b[biggestRangeIndex[0]]);
      this.calculateBoundingBox();
   }
   /**
    * @returns The {@link Line._endPoints} with each {@link Line._origin} added to them via {@link BaseObject.addOrigin}.
    */
   getVerticeVoxels () {
      return BaseObject.addOrigin(this._endPoints, this._origin);
   }
   /**
    * Changes the current {@link Line._endPoints}, set them as the {@link Line._fillVoxels}, calculautes required bounding box data.
    * @param endPoints New End Points [start, end]
    */
   changeEndPoints (endPoints) {
      this._endPoints = [endPoints[0], endPoints[1]];
      this._fillVoxels = [...this._endPoints];
      this.calculateBoundingBox();
   }
}
/**
 * Stores data structures required to create a 3D polygon in 3D space.
 */
export class Layer extends BaseObject {
   /**
    * One or more vertices that make up this polygon. Order of vertices decides how the shape will be generated.
    *
    * Use {@link Layer.getVerticeVoxels} to access vertices because this does not account for origin.
    */
   _verticesArray;
   /**
    * Stores the voxels on the edge of the polygon.
    *
    * The key is the vertice number in start to end format. For example, "V0V1" represents vertice index zero to index one from {@link _verticesArray}
    */
   edgeDirectory;
   _edgeVoxels;
   constructor(options) {
      super({
         controller: options.controller,
         origin: options.origin
      });
      this.controller.setReferenceEntry(this.uuid, this);
      this._verticesArray = BaseObject.deepCopy(options.verticesArray);
      this._fillVoxels = [...this._verticesArray];
      this.calculateBoundingBox();
      this.edgeDirectory = {};
      this.edgeVoxels = [...this._verticesArray];
   }
   /**
    * Changes the shapes vertices.
    *
    * @remarks
    * Changes fill voxels to the vertices, resets the edge directory, calculates bounding boxes.
    *
    * @param verticesArray The new set of vertices
    *
    * @returns reference to layer object, allows for method chaining.
    */
   changeVertices (verticesArray) {
      this._verticesArray = BaseObject.deepCopy(verticesArray);
      this._fillVoxels = [...this._verticesArray];
      this._edgeVoxels = [...this._verticesArray];
      this.calculateBoundingBox();
      this.edgeDirectory = {};
      return this;
   }
   /**
    * Generates the entries of {@link Layer.edgeDirectory}, where each entry is a line that connects one vertice to another.
    *
    * Use {@link Layer.getEdgeVoxels} to acess all edge voxels as a single array.
    *
    * Also adds all voxels from the edge directory to the {@link Layer._fillVoxels}.
    *
    * @returns reference to layer object, allows for method chaining.
    * 
    * @TODO account for overlapping vertices
    */
   generateEdges () {
      this._fillVoxels = [];
      this._edgeVoxels = [...this._verticesArray];
      this.calculateBoundingBox();
      let tempLine = new Line({
         endPoints: [[0, 0, 0], [0, 0, 0]],
         controller: this.controller,
         origin: this.getOrigin()
      });
      let compositeMedian = new CompositeVoxelCollection({
         origin: this.getOrigin(),
         controller: this.controller,
         variableNames: {
            [tempLine.uuid]: tempLine,
            [this.uuid]: this,
         }
      })
      compositeMedian.setEquation(tempLine.uuid + compositeMedian.tokens.SUBTRACTION_OP + this.uuid);
      this.edgeDirectory = {};
      // If this shape has more then 1 vertice
      // Loop through all the vertices
      for (let i = 0; i < this._verticesArray.length; i++) {
         // If we are at the last vertices in the list, draw back to the first one.
         let startIndex = i;
         let endIndex;
         if (i + 1 === this._verticesArray.length) {
            endIndex = 0;
         }
         else {
            endIndex = i + 1;
         }
         let entryKey = `V${startIndex}V${endIndex}`;
         tempLine.changeEndPoints([this._verticesArray[startIndex], this._verticesArray[endIndex]]);
         tempLine.generateLine();
         let lineFillVoxels = tempLine.getFillVoxels();
         this.edgeDirectory[entryKey] = lineFillVoxels;
         BaseObject.push2D(compositeMedian.interpretAST().getFillVoxels(), this._fillVoxels);
         this.calculateBoundingBox();
      }
      tempLine.delete();
      compositeMedian.delete();
      this._edgeVoxels = BaseObject.deepCopy(this._fillVoxels);
      return this;
   }
   /**
    * Uses the {@link Layer.sortedFillVoxelsDirectory} generated from the {@link Layer._fillVoxels} generated from {@link Layer.generateEdges} to fill in the shape.
    *
    * Sets {@link Layer._fillVoxels} and calculautes bounding box.
    *
    * @returns reference to layer object, allows for method chaining.
    */
   fillPolygon () {
      this._fillVoxels = [];
      this.calculateBoundingBox();
      let temporary2DSlice = new Layer({
         verticesArray: [],
         origin: this.getOrigin(),
         controller: this.controller
      });
      for (let entry of Object.keys(this.sortedFillVoxelsDirectory)) {
         let currentEntry = Number(entry);
         let entryVoxels = this.sortedFillVoxelsDirectory[currentEntry];
         temporary2DSlice.changeVertices(entryVoxels).generateEdges();
         let targetPush = []
         for (let lineKey of Object.keys(temporary2DSlice.edgeDirectory)) {
            // pointBinarySearch
            let targetLine = temporary2DSlice.edgeDirectory[lineKey];
            targetLineLoop: for (let i = 1; i < targetLine.length - 1; i++) {
               for (let j = 0; j < entryVoxels.length; j++) {
                  if (JSON.stringify(targetLine[i]) === JSON.stringify(entryVoxels[j])) {
                     continue targetLineLoop;
                  }
               }
               for (let j = 0; j < targetPush.length; j++) {
                  if (JSON.stringify(targetLine[i]) === JSON.stringify(targetPush[j])) {
                     continue targetLineLoop;
                  }
               }
               targetPush.push(targetLine[i])
               this._fillVoxels.push([...targetLine[i]])
            }
         }
      }
      temporary2DSlice.delete();
      return this;
   }
   /**
    * Compiles the {@link Layer.edgeDirectory} into a single 2D array
    * @returns Array of all voxels that make up the shape.
    */
   getEdgeVoxels () {
      return BaseObject.addOrigin(this._edgeVoxels, this._origin);
   }
   /**
    * @returns the {@link Layer._verticesArray}, accounts for origin and is mutation free.
    */
   getVerticeVoxels () {
      return BaseObject.addOrigin(this._verticesArray, this._origin);
   }
   /**
    * @override
    */
   delete () {
      this.controller.removeID(this.uuid);
      this._fillVoxels = [];
      this._edgeVoxels = [];
      this.calculateBoundingBox();
      this.uuid = "";
   }
}
/**
 * @remarks
 * Contains all of the syntax tokens used by the {@link SetOperationsParser}.
 */
export const SYNTAX_TOKENS = {
   /**
    * @remarks
    * U+03A9
    */
   UNIVERSAL_SET: "Ω",
   /**
    * @remarks
    * U+2205
    */
   NULL_SET: "∅",
   /**
    * @remarks
    * U+222A
    *
    * Not Latin Letter U with value U+0055
    */
   UNION_OP: "∪",
   /**
    * @remarks
    * U+2229
    */
   INTERSECTION_OP: "∩",
   /**
    * @remarks
    * U+002D
    */
   SUBTRACTION_OP: "-",
   /**
    * @remarks
    * U+2295
    */
   SYMM_DIFF_OP: "⊕",
   /**
    * @remarks
    * U+0021
    */
   NEGATION_OP: "!",
   /**
    * @remarks
    * U+0028
    */
   OPEN_PER: "(",
   /**
    * @remarks
    * U+0029
    */
   CLOSE_PER: ")",
   /**
    * @remarks
    * U+002D
    */
   IDENTATION: "-",
   NOT_PLACE_HOLDER: "@"
};
/**
 * @remarks
 * Holds the valid modes as accepted by the {@link SetOperationsParser.useRegex}
 */
export var SetOperationsParserAction;
(function (SetOperationsParserAction) {
   /**
    * @remarks
    * This mode signifies to use the {@link RegExp.test} method upon the given string.
    */
   SetOperationsParserAction["TEST_MODE"] = "TEST_MODE";
   /**
    * @remarks
    * This mode signifies to use the {@link String.match} method upon the given string.
    */
   SetOperationsParserAction["MATCH_MODE"] = "MATCH_MODE";
})(SetOperationsParserAction || (SetOperationsParserAction = {}));
/**
 * @remarks
 * Holds all of the {@link RegExp} used by {@link SetOperationsParser.validateEquation} to check for syntax errors and
 * convert to a valid format for {@link SetOperationsParser.generateAST}.
 */
const SYNTAX_REGEX = {
   /**
    * @remarks
    * Regular expression to split an equation string into the sub-tokens:
    *
    * /\\!*\\(|\\)|\\!*[a-zΩ∅]+|[∩⊕∪-]/gi
    *
    * Splits at either:
    *
    * 1) Zero or more negations followed by a opening grouping
    * 2) A closing grouping
    * 3) Zero or more negations followed by a varaible name or default set
    * 4) A set operation
    *
    * Flags:
    *
    * 1) Global
    * 2) Case Insensitive
    */
   "CONVERSION_REGEX": new RegExp(`\\${SYNTAX_TOKENS.NEGATION_OP}*\\${SYNTAX_TOKENS.OPEN_PER}|\\${SYNTAX_TOKENS.CLOSE_PER}|\\${SYNTAX_TOKENS.NEGATION_OP}*[a-z${SYNTAX_TOKENS.UNIVERSAL_SET}${SYNTAX_TOKENS.NULL_SET}0-9]+|[${SYNTAX_TOKENS.INTERSECTION_OP}${SYNTAX_TOKENS.SYMM_DIFF_OP}${SYNTAX_TOKENS.UNION_OP}${SYNTAX_TOKENS.SUBTRACTION_OP}]`, "gi"),
   /**
 * @remarks
 * Regular expression to check for invalid negation of a closing grouping:
 *
 * /\\!+\\)/gi
 *
 * Splits at:
 *
 * 1) One or more negations followed by an closing grouping
 *
 * Flags:
 *
 * 1) Global
 * 2) Case Insensitive
 */
   "INVALID_NEGATION_CLOSE_PER_REGEX": new RegExp(`\\${SYNTAX_TOKENS.NEGATION_OP}+\\${SYNTAX_TOKENS.CLOSE_PER}`, "gi"),
   /**
     * @remarks
     * Regular expression to check for opening grouping
     *
     * /\\(/gi
     *
     * Splits at:
     *
     * 1) Each and every opening grouping
     *
     * Flags:
     *
     * 1) Global
     * 2) Case Insensitive
     */
   "CLOSE_PER_COUNT_REGEX": new RegExp(`\\${SYNTAX_TOKENS.CLOSE_PER}`, "gi"),
   /**
 * @remarks
 * Regular expression to check for opening grouping
 *
 * /\\)/gi
 *
 * Splits at:
 *
 * 1) Each and every closing grouping
 *
 * Flags:
 *
 * 1) Global
 * 2) Case Insensitive
 */
   "OPEN_PER_COUNT_REGEX": new RegExp(`\\${SYNTAX_TOKENS.OPEN_PER}`, "gi"),
   /**
   * @remarks
   * Regular expression to check for invalid equation endings
   *
   * /[(!∩⊕∪-]$/gi
   *
   * Splits at a ending of:
   *
   * 1) Opening grouping, set operation
   *
   * Flags:
   *
   * 1) Global
   * 2) Case Insensitive
   */
   "INVALID_ENDING_REGEX": new RegExp(`[${SYNTAX_TOKENS.OPEN_PER}${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.INTERSECTION_OP}${SYNTAX_TOKENS.SYMM_DIFF_OP}${SYNTAX_TOKENS.UNION_OP}${SYNTAX_TOKENS.SUBTRACTION_OP}]$`),
   /**
    * @remarks
    * Regular expression to check for invalid negation
    *
    * /\\!+[-⊕]/gi
    *
    * Splits at:
    *
    * 1) One or more negations followed by a subtraction or symmertic difference
    *
    * Note: These operations can only be negated if the encapsulated grouping is negated
    * !(a-b) instead of (a!-b)
    *
    * Flags:
    *
    * 1) Global
    * 2) Case Insensitive
    */
   "INVALID_OP_DIRECT_NEGATE_REGEX": new RegExp(`\\${SYNTAX_TOKENS.NEGATION_OP}+[${SYNTAX_TOKENS.SUBTRACTION_OP}${SYNTAX_TOKENS.SYMM_DIFF_OP}]`, "gi"),
   /**
   * @remarks
   * Regular expression to check for invalid junction
   *
   * /[Ω∅)a-z]+\\(|\\(\\)|[∩⊕∪-]+\\)|[Ω∅]{2,}/gi
   *
   * Splits at either:
   *
   * 1) A varaible or defualt set followed by an opening grouping
   * 2) A opening grouping followed by closing grouping
   * 3) A operation followed by an closing grouping
   * 4) Two or more defualt sets next to each other
   *
   * Flags:
   *
   * 1) Global
   * 2) Case Insensitive
   */
   "INVALID_JUNCTION_REGEX": new RegExp(`[${SYNTAX_TOKENS.UNIVERSAL_SET}${SYNTAX_TOKENS.NULL_SET}${SYNTAX_TOKENS.CLOSE_PER}a-z]+\\${SYNTAX_TOKENS.OPEN_PER}|\\${SYNTAX_TOKENS.OPEN_PER}\\${SYNTAX_TOKENS.CLOSE_PER}|[${SYNTAX_TOKENS.INTERSECTION_OP}${SYNTAX_TOKENS.SYMM_DIFF_OP}${SYNTAX_TOKENS.UNION_OP}${SYNTAX_TOKENS.SUBTRACTION_OP}]+\\${SYNTAX_TOKENS.CLOSE_PER}|[${SYNTAX_TOKENS.UNIVERSAL_SET}${SYNTAX_TOKENS.NULL_SET}]{2,}`, "gi"),
   /**
  * @remarks
  * Checks if a given character is a valid character as defined by static syntax.
  * This expression is ran against each character in the string using {@link RegExp.test()} syntax.
  *
  * /\\s|[a-z]|[Ω∅∪∩⊕!()-]/gi
  *
  * Splits at either:
  *
  * 1) White space
  * 2) a-z varaible name
  * 3) Operation, negation, or groupings
  *
  * Flags:
  *
  * 1) Global
  * 2) Case Insensitive
  */
   "VALID_CHAR_REGEX": new RegExp(`\\s|[a-z]|[${SYNTAX_TOKENS.UNIVERSAL_SET}${SYNTAX_TOKENS.NULL_SET}${SYNTAX_TOKENS.UNION_OP}${SYNTAX_TOKENS.INTERSECTION_OP}${SYNTAX_TOKENS.SYMM_DIFF_OP}${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.OPEN_PER}${SYNTAX_TOKENS.CLOSE_PER}${SYNTAX_TOKENS.SUBTRACTION_OP}]|\\d`, "gi")
};
/**
    * @remarks
    * The rankings of all of the equation syntax. The program decides what operations to do first based on ranking and then on left to right order
    *
    * 1) Opening Grouping: 3
    * 2) Closing Grouping: 3
    * 3) Negation: 2
    * 4) Symmertic Difference: 1
    * 5) Subtraction, Intersection, Union: 0
    *
   */
const OPS = {
   [SYNTAX_TOKENS.OPEN_PER]: 3,
   [SYNTAX_TOKENS.CLOSE_PER]: 3,
   [SYNTAX_TOKENS.NEGATION_OP]: 2,
   [SYNTAX_TOKENS.SYMM_DIFF_OP]: 1,
   [SYNTAX_TOKENS.SUBTRACTION_OP]: 0,
   [SYNTAX_TOKENS.INTERSECTION_OP]: 0,
   [SYNTAX_TOKENS.UNION_OP]: 0
};
/**
 * A final all static parser to convert discrete math equations into valid abstract syntax trees {@link AST}.
 */
export class SetOperationsParser {
   /**
    * @remarks
    * Private constructor to support final class functionality
    */
   constructor() { }
   /**
    * @remarks
    * Retrives a mutation-free copy of the {@link SYNTAX_REGEX}
    * @returns A dictionary where the key string is the name of the regex value.
    */
   static getAllRegex () {
      return Object.keys(SYNTAX_REGEX).reduce((prev, key) => {
         return prev[key] = new RegExp(SYNTAX_REGEX[key].source, "gi"), prev;
      }, {});
   }
   /**
    * @remarks
    * Retrieves the order of operations presidence of a given token in reference to other valid tokens
    * @param token A valid key within {@link OPS}.
    * @returns The value inclusively between 3 and 0 of the tokens order of operations.
    */
   static accessOPS (token) {
      return OPS[token];
   }
   /**
    * @remarks
    * Retrieves a mutation-free copy of the {@link OPS}
    * @returns A dictionary where the key string is the token, and the value is the presdience.
    */
   static getOPS () {
      return Object.assign({}, OPS);
   }
   /**
    * @remarks
    * The valid tokens for the {@link SetOperationsParser} as defined by {@link SYNTAX_TOKENS}
    * @returns A dictionary where the key string is the name of the token, and the value is the token string.
    */
   static getSymbols () {
      return {
         UNIVERSAL_SET: SYNTAX_TOKENS.UNIVERSAL_SET,
         NULL_SET: SYNTAX_TOKENS.NULL_SET,
         UNION_OP: SYNTAX_TOKENS.UNION_OP,
         INTERSECTION_OP: SYNTAX_TOKENS.INTERSECTION_OP,
         SUBTRACTION_OP: SYNTAX_TOKENS.SUBTRACTION_OP,
         SYMM_DIFF_OP: SYNTAX_TOKENS.SYMM_DIFF_OP,
         NEGATION_OP: SYNTAX_TOKENS.NEGATION_OP,
         OPEN_PER: SYNTAX_TOKENS.OPEN_PER,
         CLOSE_PER: SYNTAX_TOKENS.CLOSE_PER,
         IDENTATION: SYNTAX_TOKENS.IDENTATION,
      };
   }
   /**
    * @remarks
    * Allows for use of the private syntax error checking RegExp outside of the {@link SetOperationsParser.validateEquation} context.
    * The {@link SYNTAX_REGEX} are mutable due to the global flag. By using this method, the {@link RegExp.lastIndex} is reset each call
    * to prevent mutations across mutiple calls. Otherwise, pattern matching would return alternating results.
    * @param name The name of the regular expression from {@link SYNTAX_REGEX}.
    * @param str The string that will be pattern matched or tested against the RegExp.
    * @param action The mode to specify either a matching to return a string array, or a test mode to return a boolean. Modes as per {@link SetOperationsParserAction}
    * @returns
    */
   static useRegex (name, str, action) {
      let regex = new RegExp(SYNTAX_REGEX[`${name}`].source, "gi");
      let matchResult;
      let boolResult = false;
      if (action === SetOperationsParserAction.TEST_MODE) {
         boolResult = regex.test(str);
         regex.lastIndex = 0;
         return boolResult;
      }
      else if (action === SetOperationsParserAction.MATCH_MODE) {
         matchResult = str.match(regex);
         regex.lastIndex = 0;
         return matchResult === null ? [] : matchResult;
      }
      else {
         throw new TypeError("Invalid Action: " + action);
      }
   }
   /**
    * @remarks
    * Takes in a string equation, checks for syntax errors via the {@link SYNTAX_REGEX}, reduces reduces complexity via basic identities,
    * returns an array of tokens in {@link SetOperationsParser.generateAST} format via {@link SYNTAX_REGEX.CONVERSION_REGEX}
    * @param str Equation in a string format.
    * @returns Valid AST generation format for input into {@link SetOperationsParser.generateAST}.
    * @throws {@link TypeError} If a syntax error is encountered.
    */
   static validateEquation (str) {
      // Filter whitespace
      str = str.split("").filter(x => !/\s/.test(x)).join("");
      /**
       * @remarks
       * Used to store tokens, both for comparison and error throwing, throughout the validation process.
       */
      let errorTokens;
      // Invalid characters are those not a-zA-Z and are not static symbols
      for (let i = 0; i < str.length; i++) {
         errorTokens = SetOperationsParser.useRegex("VALID_CHAR_REGEX", str[i], SetOperationsParserAction.TEST_MODE);
         if (!errorTokens) {
            throw new TypeError(`VALID_CHAR_REGEX | Unable to validate equationString "${str}": Invalid token ${str[i]}`);
         }
      }
      errorTokens = SetOperationsParser.useRegex("INVALID_NEGATION_CLOSE_PER_REGEX", str, SetOperationsParserAction.TEST_MODE);
      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_NEGATION_CLOSE_PER_REGEX | Unable to validate equationString "${str}": Cannot pre negate "${SYNTAX_TOKENS.NEGATION_OP}" closing grouping syntax "${SYNTAX_TOKENS.CLOSE_PER}" with tokens "${errorTokens[0]}" `);
      }
      let cper = SetOperationsParser.useRegex("CLOSE_PER_COUNT_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      let oper = SetOperationsParser.useRegex("OPEN_PER_COUNT_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      if (oper instanceof Array && cper instanceof Array && cper.length !== oper.length) {
         throw new TypeError(`CLOSE_PER_COUNT_REGEX, OPEN_PER_COUNT_REGEX | Unable to validate equationString "${str}": unequal amount of starting and ending grouping syntax`);
      }
      errorTokens = SetOperationsParser.useRegex("INVALID_ENDING_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_ENDING_REGEX | Unable to validate equationString "${str}": Ends with operator, negation or opening grouping syntax token: "${errorTokens}"`);
      }
      errorTokens = SetOperationsParser.useRegex("INVALID_OP_DIRECT_NEGATE_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_OP_DIRECT_NEGATE_REGEX | Unable to validate equationString "${str}": Cannot directly negate symmetric difference or subtraction operator "${errorTokens}"`);
      }
      errorTokens = SetOperationsParser.useRegex("INVALID_JUNCTION_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_JUNCTION_REGEX | Unable to validate equationString "${str}": Invalid Junction between two tokens "${errorTokens}"`);
      }
      /*
        Replace negation operations, Optimization
      */
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.NEGATION_OP}`, "");
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.INTERSECTION_OP}`, `${SYNTAX_TOKENS.UNION_OP}`);
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.UNION_OP}`, `${SYNTAX_TOKENS.INTERSECTION_OP}`);
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.UNIVERSAL_SET}`, `${SYNTAX_TOKENS.NULL_SET}`);
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.NULL_SET}`, `${SYNTAX_TOKENS.UNIVERSAL_SET}`);
      // Remove the grouping if they are the first and last elements in the string
      if (oper instanceof Array && cper instanceof Array && cper.length === 1 && oper.length === 1 && str[0] === SYNTAX_TOKENS.OPEN_PER && str[str.length - 1] === SYNTAX_TOKENS.CLOSE_PER) {
         str = str.replace(`${SYNTAX_TOKENS.OPEN_PER}`, "").replace(`${SYNTAX_TOKENS.CLOSE_PER}`, "");
      }
      return SetOperationsParser.useRegex("CONVERSION_REGEX", str, SetOperationsParserAction.MATCH_MODE);
   }
   /**
    * @remarks
    * Distributes the negation operation to a AST, recursively goes down all levels of the AST. Any branches that start with "NOT" as the first token in the expression will not be distrubuted to.
    * @param eq The AST
    * @param log boolean to siginify if the program should log the process to the console.
    * @param depth Level of depth for this current recursive call. Can be any number 0 and above.
    * @returns The negated AST.
    */
   static _distrubuteNegate (eq, log, depth) {
      let str = "";
      for (let i = 0; i < depth; i++) {
         str += SYNTAX_TOKENS.IDENTATION;
      }
      if (log) {
         console.log(str + "Distrubting negation to: " + JSON.stringify(eq));
      }
      for (let i = 0; i < eq.length; i++) {
         if (eq[i] === SYNTAX_TOKENS.SYMM_DIFF_OP) {
            throw new TypeError("Processing error: can not directly negate SYMM_DIFF_OP: " + eq[i]);
         }
         if (Array.isArray(eq[i]) && eq[i]) {
            if (log) {
               console.log(str + " Activiated distribution to sub-AST");
            }
            eq[i] = SetOperationsParser._distrubuteNegate(eq[i], log, depth);
         }
         else if (eq[i] === SYNTAX_TOKENS.UNION_OP) {
            eq[i] = SYNTAX_TOKENS.INTERSECTION_OP;
         }
         else if (eq[i] === SYNTAX_TOKENS.INTERSECTION_OP) {
            eq[i] = SYNTAX_TOKENS.UNION_OP;
         }
         else if (eq[i] === SYNTAX_TOKENS.NEGATION_OP) {
            eq[i] = "";
         }
         else if (typeof eq[i] === 'string' && eq[i].split("")[0] === SYNTAX_TOKENS.NEGATION_OP) {
            eq[i] = eq[i].slice(1, eq[i].length);
         }
         else if (eq[i] === SYNTAX_TOKENS.SUBTRACTION_OP) {
            if (log) {
               console.log(str + "Subtraction negation detected, switching to union and halting");
            }
            // Cuts off last operation to satifsy !(a-b) = !a U b;
            eq[i] = SYNTAX_TOKENS.UNION_OP;
            return eq;
         }
         else if (eq[i] === SYNTAX_TOKENS.UNIVERSAL_SET) {
            eq[i] = SYNTAX_TOKENS.NULL_SET;
         }
         else if (eq[i] === SYNTAX_TOKENS.NULL_SET) {
            eq[i] = SYNTAX_TOKENS.UNIVERSAL_SET;
         }
         else {
            eq[i] = [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, eq[i]];
            console.log(str + "Setting to Universal minus " + eq[i]);
         }
      }
      return eq;
   }
   /**
    * @remarks
    * Generate and returns a abstract syntax tree {@link AST} that represents the presidence of solving the equation.
    * @param eq The AST at this level. The inital input is an array of strings from {@link SetOperationsParser.validateEquation}.
    * @param log boolean to siginify if the program should log the process to the console, default value of false.
    * @param depth Level of depth for this current recursive call. Can be any number 0 (default) and above initally.
    * @returns When the call stack collapses, the method will return an AST. During the recursive process, the method could flatten various levels of the AST
    * to simplify expressions resulting in a string return type.
    */
   static generateAST (eq, log, depth = 0) {
      let string = "";
      if (log) {
         for (let i = 0; i <= depth; i++) {
            string += SYNTAX_TOKENS.IDENTATION;
         }
         console.log(string + "Input EQ: " + JSON.stringify(eq));
         console.log(string + "Length of EQ: " + (eq.length));
         depth += 1;
      }
      /**
   * @remarks
   * The index of the variable on the left side of the operation.
   */
      let startIndex = -1;
      /**
       * @remarks
       * The index of the variable on the right side of the operation.
       */
      let endIndex = -1;
      /**
      * @remarks
      * The index of the operation.
      */
      let opIndex = -1;
      /**
       * @remarks
       * The value of this operation as stored in {@link OPS} accessiable via {@link SetOperationsParser.accessOPS}
       */
      let indexValue = -1;
      /**
       * @remarks
       * Stores the indicies of all of the opening grouping tokens, used to decide {@link perStartIndex}.
       */
      let startPerArray = [];
      /**
       * @remarks
       * Stores the indicies of all of the closing grouping tokens, used to decide {@link perEndIndex}.
       */
      let endPerArray = [];
      /**
       * @remarks
       * Stores the indicies of all of the negated opening grouping tokens, has overlap with {@link startPerArray}.
       */
      let negatedPerArray = [];
      /**
       * @remarks
       * Stores the indicies of all of the symmertic difference operations. This is important, because if a SD is within a negated
       * grouping, special conversion processes need to take place before {@link SetOperationsParser._distrubuteNegate}
       * is called upon that section of the AST.
       */
      let symmPerArray = [];
      if (eq.length <= 2) {
         if (log) {
            console.log(string + "Equation length is <= 2, returning equation");
         }
         return [...eq];
      }
      // The first step is to gather metadata about the AST.
      for (let i = 0; i < eq.length; i++) {
         let token = eq[i];
         if (log) {
            console.log(string + "Checking Token: " + JSON.stringify(token));
         }
         // Remove double or more negation
         if (!Array.isArray(token) && token.startsWith("!!")) {
            if (log) {
               console.log(string + "Token starts with n >= 2 negation: " + token);
            }
            // If the negation amount is odd, make it a single negation. Otherwise, no negation.
            let testToken = token.split("");
            token = (testToken.slice(0, testToken.length - 1).length % 2 === 0 ? "" : SYNTAX_TOKENS.NEGATION_OP) + testToken[testToken.length - 1];
            if (log) {
               console.log(string + "Converted Token starts with n >= 2 negation: " + token);
            }
            eq[i] = token;
         }
         if (token === SYNTAX_TOKENS.SYMM_DIFF_OP) {
            symmPerArray.push(i);
         }
         // Gather negated grouping information.
         if (!Array.isArray(token) && token.startsWith(SYNTAX_TOKENS.NEGATION_OP)) {
            if (log) {
               console.log(string + "Token starts with negation");
            }
            token = token.split("");
            if (token[1] === SYNTAX_TOKENS.OPEN_PER) {
               if (log) {
                  console.log(string + "Token is negating open Grouping");
               }
               negatedPerArray.push(i);
            }
            /*
               * 1) This does not mutate the original eq equation,
               * Only changes the value of the token to exclude the negation: "!(" is changed to "(" locally only within the loop.
               * This allows for startPerArray to also pick it up using an "token === SYNTAX_TOKENS.OPEN_PER" comaparision.
               * 2) We also do this because typeScript is not smart enough to recongize that the "!Array.isArray(token)" guarding block
               * is preventing any arrays (AST) from entering this section of code.
               * To TypeScript, any use of eq[i] can be either an AST or string,
               * regardless of the actual value at that index and any guarding block it is witihin.
               * The solution is type asserstion as an key of OPS, while choosing a set numerical value (token[i] as OPS_TOKEN doesn't work)
            */
            token = token[1];
            if (!OPS.hasOwnProperty(token)) {
               eq[i] = [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, token];
               if (log) {
                  console.log(string + "Activated Token is negating set: " + JSON.stringify(eq[i]));
               }
            }
         }
         if (token === SYNTAX_TOKENS.OPEN_PER) {
            startPerArray.push(i);
         }
         else if (token == SYNTAX_TOKENS.CLOSE_PER) {
            endPerArray.push(i);
         }
         /*
         This IS a set operation token
         AND
         Either {
           Index value IS undefined
           OR
           This token's index value is GREATER than the previous stored index value
         }
         AND NOT {
            A symmertic difference operater AND followed by an negated opening group
         }
    
         - In the edge case of: [[[["Ω","-","a"],"∩",["Ω","-","b"]],"∪",["a","∩","b"]],"⊕","!(","a","⊕","b",")"]
         - This program will favor the first symmertic difference, and choose end varaible as "!(", causing an error.
         - This is prevented by the AND NOT edge case check.
         
         */
         else if (OPS.hasOwnProperty(token)
            && (indexValue === undefined || OPS[token] > indexValue)
            && !(token === SYNTAX_TOKENS.SYMM_DIFF_OP && eq[i + 1] === `${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.OPEN_PER}`)) {
            if (log) {
               console.log(string + "Activated operation identification loop condition");
            }
            indexValue = OPS[token];
            endIndex = i + 1;
            startIndex = i - 1;
            opIndex = i;
         }
      }
      // The base case is if the equation is 3 tokens including arrays
      // However, instances such as ["!(",["a","⊕","b"],")"] may cause this to activate, 
      // so their can't be parenthsis
      if (eq.length === 3 && startPerArray.length === 0 && endPerArray.length === 0) {
         if (log) {
            console.log(string + "Activated EQ Length is 3");
         }
         // Optimizations
         if (JSON.stringify(eq[0]) === JSON.stringify(eq[2])) {
            if (eq[1] === SYNTAX_TOKENS.INTERSECTION_OP || eq[1] === SYNTAX_TOKENS.UNION_OP) {
               if (log) {
                  console.log(string + "Activated L3 Intersection or Union with self, returning self");
               }
               return depth === 1 ? [eq[0]] : eq[0];
            }
            if (eq[1] === SYNTAX_TOKENS.SYMM_DIFF_OP || eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP) {
               if (log) {
                  console.log(string + "Activated L3 Symmertic Difference or subtraction with itself returning null");
               }
               return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET;
            }
         }
         // If the left or right side of the equation is a null set
         if (eq[0] === SYNTAX_TOKENS.NULL_SET || eq[2] === SYNTAX_TOKENS.NULL_SET) {
            // Intersection them returns a null set
            if (eq[1] === SYNTAX_TOKENS.INTERSECTION_OP) {
               if (log) {
                  console.log(string + "L3: Activated intersection null");
               }
               return SYNTAX_TOKENS.NULL_SET;
            }
            else if (eq[1] === SYNTAX_TOKENS.UNION_OP || eq[1] === SYNTAX_TOKENS.SYMM_DIFF_OP) {
               if (log) {
                  console.log(string + "L3: Activated union null");
               }
               return eq[0] === SYNTAX_TOKENS.NULL_SET ? depth === 1 ? [eq[2]] : eq[2] : depth === 1 ? [eq[0]] : eq[0];
            }
            else if (eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP) {
               if (log) {
                  console.log(string + "L3: Activiated set subtraction with null set");
               }
               /* In SQL, null minus null yeilds null so I apply this logic */
               // null - set
               if (eq[0] === SYNTAX_TOKENS.NULL_SET) {
                  return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET;
               }
               else {
                  // set - null
                  return depth === 1 ? [eq[0]] : eq[0];
               }
            }
         }
         // a set minus the universal leaves nothing left over.
         if (eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP && eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET) {
            if (log) {
               console.log(string + "L3: Activated minus universal set equals null");
            }
            return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET;
         }
         // union to a universal set
         if ((eq[1] === SYNTAX_TOKENS.UNION_OP) && (eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET || eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET)) {
            if (log) {
               console.log(string + "L3: Activated union universal set equals universal");
            }
            return depth === 1 ? [SYNTAX_TOKENS.UNIVERSAL_SET] : SYNTAX_TOKENS.UNIVERSAL_SET;
         }
         // intersection to a universal set
         if ((eq[1] === SYNTAX_TOKENS.INTERSECTION_OP) && (eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET || eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET)) {
            if (log) {
               console.log(string + "L3: Activated intersection universal set");
            }
            return eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET ? depth === 1 ? [eq[2]] : eq[2] : depth === 1 ? [eq[0]] : eq[0];
         }
         if (log) {
            console.log(string + "L3: Returning eq");
         }
         return [...eq];
      }
      if (symmPerArray.length > 0) {
         if (log) {
            console.log(string + "Amount of Symmertries: " + symmPerArray.length);
         }
      }
      /// This should be detected if the equation is validated, but parser errors can happen.
      if (startPerArray.length !== endPerArray.length) {
         console.log(eq, startPerArray, endPerArray);
         throw new Error("Invalid Amount of Grouping");
      }
      // From here, figure out the most embedded group of parenthesis.
      let groupRanking = {};
      let groupCounter = 0;
      // If their is closing or opening grouping.
      let allPerArray = [...startPerArray, ...endPerArray];
      while (allPerArray.length > 0) {
         let perStartIndex = -1;
         let perEndIndex = -1;
         allPerArray = [...startPerArray, ...endPerArray];
         // Create a list of all the indicies of the grouping
         // For all opening paratntehis
         startLoop: for (const openPerIter of startPerArray) {
            // Set the new startIndex for the next equation subsection
            perStartIndex = openPerIter;
            // for each end grouping
            endLoop: for (const endPerIter of endPerArray) {
               // If the end grouping is before the opening e.x. (a-b)+(c+d) compaing closing of left to opening of right term.
               if (endPerIter <= openPerIter) {
                  // Continue because this is an invalid grouping.
                  continue;
               }
               // Loop through all other grouping
               for (const allPerIter of allPerArray) {
                  // if any other parenteshsis fall between this start and end,
                  // then this is not the most embedded group
                  if (allPerIter > openPerIter && allPerIter < endPerIter) {
                     continue endLoop;
                  }
               }
               // If we manage to get through without causing a continue,
               // then set the endIndex to this end paretthesis and break the process.
               groupCounter++;
               perEndIndex = endPerIter;
               groupRanking[`${groupCounter}`] = {
                  "i": [perStartIndex, perEndIndex],
                  "n": eq[perStartIndex] === `${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.OPEN_PER}`
               };
               startPerArray = startPerArray.filter((v, i) => i !== startPerArray.indexOf(perStartIndex));
               endPerArray = endPerArray.filter((v, i) => i !== endPerArray.indexOf(perEndIndex));
               break startLoop;
            }
         }
      }
      let targetOpeningPer = -1;
      let targetClosingPer = -1;
      let negatedOpeningPer = -1;
      let negatedClosingPer = -1;
      let groupRankingKeys = Object.keys(groupRanking);
      if (groupRankingKeys.length > 0) {
         targetOpeningPer = groupRanking["1"]["i"][0];
         targetClosingPer = groupRanking["1"]["i"][1];
         let closetRanking = -1;
         for (let key of groupRankingKeys) {
            // Find the negating grouping that is the closet depth to our current opening and closing.
            if (groupRanking[key]["n"] &&
               // Surronds the current non-negating grouping
               groupRanking[key]["i"][0] <= targetOpeningPer &&
               groupRanking[key]["i"][1] >= targetClosingPer &&
               // This ranking is closer to 0 as possible
               (Number(key) < closetRanking || closetRanking === -1)) {
               closetRanking = Number(key);
               negatedOpeningPer = groupRanking[key]["i"][0];
               negatedClosingPer = groupRanking[key]["i"][1];
            }
         }
      }
      if (log) {
         console.log(string + "Grouping Ranking" + JSON.stringify(groupRanking));
         console.log(string + "Target Opening Grouping Index " + targetOpeningPer);
         console.log(string + "Target Closing Grouping Index " + targetClosingPer);
         console.log(string + "Target Negated Opening Grouping Index " + negatedOpeningPer);
         console.log(string + "Target Negated Opening Grouping Index " + negatedClosingPer);
      }
      // If their is grouping that is being negated, their may be symmertic differences within that parenthesis that are being negated.
      // If we have a negation somewhere in the array.
      if (negatedClosingPer !== -1 && negatedOpeningPer != -1) {
         if (log) {
            console.log(string + "Activiated Symmertric Difference negation check");
         }
         // Check if a symmertic difference is between it at any level.
         for (let i = 0; i < symmPerArray.length; i++) {
            // If this symmsertic difference is between the negation grouping
            if (symmPerArray[i] > negatedOpeningPer && symmPerArray[i] < negatedClosingPer) {
               if (log) {
                  console.log(string + `Symmertic difference at index ${symmPerArray[i]} is being negated.`);
               }
               eq[negatedOpeningPer] = `${SYNTAX_TOKENS.OPEN_PER}`;
               return SetOperationsParser.generateAST([...eq.slice(0, negatedOpeningPer), [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, SetOperationsParser.generateAST([...eq.slice(negatedOpeningPer + 1, negatedClosingPer)], log, depth)], ...eq.slice(negatedClosingPer + 1, eq.length)], log, depth);
            }
         }
      }
      // Otherwise, if the start index for the most embedded grouping is also being negated "!(a+b)"
      else if (negatedClosingPer !== -1 && negatedOpeningPer != -1) {
         if (log) {
            console.log(string + "Activated Negated Grouping is startIndex");
         }
         // Previously, this operation on token did not mutate. Now we mutate the equation and remove the negative.
         eq[targetOpeningPer] = SYNTAX_TOKENS.OPEN_PER;
         // Then, distrubute that grouping and all of the sub-groupings.
         eq = [...eq.slice(0, targetOpeningPer), ...this._distrubuteNegate(eq.slice(targetOpeningPer + 1, targetClosingPer), log, depth), ...eq.slice(targetClosingPer + 1, eq.length)];
         if (log) {
            console.log(string + "Combined and negated equation: " + JSON.stringify(eq));
         }
         // Otherwise, if this grouping is not being negated, then group all of the elements within that group into a new array
         // This gives presidence to that section of the AST.
      }
      else if (targetOpeningPer !== -1 && targetClosingPer !== -1) {
         if (log) {
            console.log(string + "Activated startPerArray Length Condition because their are " + startPerArray.length + " opening grouping syntax, target grouping syntax is at EQ startIndex: " + targetOpeningPer);
         }
         eq = [...eq.slice(0, targetOpeningPer), SetOperationsParser.generateAST(eq.slice(targetOpeningPer + 1, targetClosingPer), log, depth), ...eq.slice(targetClosingPer + 1, eq.length)];
      }
      // Otherwise, no grouping, just a pure A+B+C for example.
      else {
         if (log) {
            console.log(string + "Operation Index: " + opIndex);
         }
         // Turns ["A","+","B","+","C"] into [["A","+","B"],"+","C"]
         eq = [...eq.slice(0, startIndex), SetOperationsParser.generateAST([eq[startIndex], eq[opIndex], eq[endIndex]], log, depth), ...eq.slice(endIndex + 1, eq.length)];
      }
      // After all of this, put it back through the the parser again.
      // Need to use new varaible here because EQ is always an array, and since the collapse of the call may return a
      // string, we need to allow it to accept both because typescript.
      let newEq = SetOperationsParser.generateAST(eq, log, depth);
      if (log) {
         console.log(string + "Equation is finalized, pushing to the tree");
      }
      console.log(string + JSON.stringify(newEq));
      // Then, pass this section of the AST back into the final AST. Collapse and return final result if at bottom of call stack.
      return newEq;
   }
}
/**
 * @remarks
 * Acts as a interface to {@link SetOperationsParser} with pass through methods and the storage of equation data.
 */
export class SetOperationsEquation {
   /**
    * @remarks
    * Stores the current equation pre-AST generation
    */
   equationString;
   /**
    * If the {@link SetOperationsParser.generateAST} should produce a log to the console.
    */
   log;
   /**
    * The output of passing {@link SetOperationsEquation.equationString} through {@link SetOperationsParser.validateEquation}
    */
   validEquationArray;
   /**
    * The output of passing {@link SetOperationsEquation.validEquationArray} through {@link SetOperationsParser.generateAST}.
    * This AST is stored as private to create a mutation-free storage.
    */
   equationAST = [];
   /**
    * @remarks
    * Constructs a new {@link SetOperationsEquation}.
    * @param str The string equation to create a new AST from
    * @param log Log production flag for {@link SetOperationsParser.generateAST}
    */
   constructor(str, log) {
      this.equationString = str;
      this.log = log;
      this.validEquationArray = [];
   }
   /**
    * @remarks
    * Accepts a new string as the {@link SetOperationsEquation.equationString}, resets all attributes accept {@link SetOperationsEquation.log}
    * @param str New equation strng
    */
   changeEquation (str) {
      this.equationString = str;
      this.validEquationArray = [];
      this.equationAST = [];
   }
   /**
    * @remarks
    * To be called before {@link SetOperationsEquation.generateAST}.
    * Pass through functon to {@link SetOperationsParser.validateEquation} with {@link SetOperationsEquation.equationString} as the arguement.
    */
   validateEquation () {
      this.validEquationArray = SetOperationsParser.validateEquation(this.equationString);
   }
   /**
    * @remarks
    * To be called after {@link SetOperationsEquation.validateEquation}.
    * Pass through functon to {@link SetOperationsParser.generateAST} with arguments {@link SetOperationsEquation.validEquationArray},
    * {@link SetOperationsEquation.log}, and inital depth of zero.
    */
   generateAST () {
      this.equationAST = SetOperationsParser.generateAST([...this.validEquationArray], this.log, 0);
   }
   /**
    * @remarks
    * Returns stored AST
    * @returns Uses {@link JSON.parse} of {@link JSON.stringify} to return a deep copy of the AST.
    */
   getAST () {
      return JSON.parse(JSON.stringify(this.equationAST));
   }
}
/**
 * Acts as a median to {@link BaseObject} when the user may simply want to store voxels without them belonging to a particular shape.
 *
 * Used by {@link CompositeVoxelCollection} to temporarily hold the intersection voxels between shapes
 *
 * Alows the user to pass in an array of voxels for storage
 */
export class VoxelCollection extends BaseObject {
   constructor(options) {
      super({
         "controller": options.controller,
         "origin": options.origin
      });
      this._fillVoxels = [];
      BaseObject.push2D(options.fillVoxels, this._fillVoxels);
      this.calculateBoundingBox();
   }
   setFillVoxels (newVoxels) {
      this._fillVoxels = [];
      BaseObject.push2D(newVoxels, this._fillVoxels);
      this.calculateBoundingBox();
      return this;
   }
   addFillVoxels (newVoxels) {
      BaseObject.push2D(newVoxels, this._fillVoxels);
      this.calculateBoundingBox();
      return this;
   }
}
export class CompositeVoxelCollection extends BaseObject {
   equationInstance;
   virtualCache;
   tokens;
   variableNames;
   constructor(options) {
      super({
         "controller": options.controller,
         "origin": options.origin
      });
      this.variableNames = options.variableNames;
      this.equationInstance = new SetOperationsEquation("", options.log);
      this._fillVoxels = [];
      for (let key of Object.keys(this.variableNames)) {
         BaseObject.push2D(this.variableNames[key].getFillVoxels(), this._fillVoxels);
      }
      this.calculateBoundingBox();
      this.tokens = SetOperationsParser.getSymbols();
      this.virtualCache = {};
      this.resetVirtualCache();
   }
   /**
    * @override
    */
   delete () {
      this.controller.removeID(this.uuid);
      this._fillVoxels = [];
      this._edgeVoxels = [];
      this.calculateBoundingBox();
      this.resetVirtualCache();
      this.uuid = "";
   }
   resetVirtualCache () {
      let prevHeapKeys = Object.keys(this.virtualCache);
      for (let i = 0; i < prevHeapKeys.length; i++) {
         if (prevHeapKeys[i] !== this.tokens.UNIVERSAL_SET || prevHeapKeys[i] !== this.tokens.NULL_SET) {
            this.virtualCache[prevHeapKeys[i]].delete();
            delete this.virtualCache[prevHeapKeys[i]];
         }
      }
      let voxels = [];
      for (let key of Object.keys(this.variableNames)) {
         BaseObject.push2D(this.variableNames[key].getFillVoxels(), voxels);
      }
      this.virtualCache = {
         [this.tokens.UNIVERSAL_SET]: new VoxelCollection({ controller: this.controller, fillVoxels: voxels, origin: this._origin }),
         [this.tokens.NULL_SET]: new VoxelCollection({ controller: this.controller, fillVoxels: [], origin: this._origin })
      };
      return this;
   }
   changeNames (variableNames) {
      this.variableNames = Object.assign({}, variableNames);
      this.resetVirtualCache();
      return this;
   }
   setEquation (equation) {
      this.equationInstance.changeEquation(equation);
      this.equationInstance.validateEquation();
      this.equationInstance.generateAST();
      return this;
   }
   #recursiveSolver (layer, depth) {
      // need to deal with one length equations
      let token1 = "";
      let operation = "";
      let token2 = "";
      let str = "";
      for (let i = 0; i < depth; i++) {
         str += "-";
      }
      for (let i = 0; i < layer.length; i++) {
         if (Array.isArray(layer[i])) {
            layer[i] = this.#recursiveSolver(layer[i], depth + 1);
         }
      }
      token1 = layer[0];
      if (layer.length !== 1) {
         operation = layer[1];
         token2 = layer[2];
      }
      // Default sets are not avaiable in the users memory address.
      try {
         if (typeof token1 === "string" && (token1 === this.tokens.UNIVERSAL_SET || token1 === this.tokens.NULL_SET)) {
            token1 = this.virtualCache[token1];
         }
         else if (typeof token1 === "string") {
            token1 = this.variableNames[token1];
         }
         if (token1 === undefined) {
            throw new TypeError("Token 1 undefined");
         }
      }
      catch (e) {
         console.warn("Interpet Error: logging heap and names");
         console.warn(this.virtualCache);
         console.warn(this.variableNames);
         throw new ReferenceError("Unable to find the heap address for token1: " + token1);
      }
      // Now that the values have been re-trieved, make sure to terminate if the layer is one in length
      if (layer.length === 1) {
         return token1;
      }
      else if (layer.length === 2) {
         console.warn("Interpet Error: logging heap and names");
         console.warn(this.virtualCache);
         console.warn(this.variableNames);
         throw new ReferenceError("Invalid sub-equation length two from AST layer: " + token1);
      }
      try {
         if (typeof token2 === "string" && (token2 === this.tokens.UNIVERSAL_SET || token2 === this.tokens.NULL_SET)) {
            token2 = this.virtualCache[token2];
         }
         else if (typeof token2 === "string") {
            token2 = this.variableNames[token2];
         }
         if (token2 === undefined) {
            throw new TypeError("Token 2 undefined");
         }
      }
      catch (e) {
         console.warn("Interpet Error: logging heap and names");
         console.warn(this.virtualCache);
         console.warn(this.variableNames);
         throw new ReferenceError("Unable to find the heap address or variableNames address for token2: " + token2);
      }
      let memoryQueryOne = token1.uuid + operation + token2.uuid;
      let memoryQueryTwo = token2.uuid + operation + token1.uuid;
      // First, check the cache to see if these operations have been done before. 
      let currentHeapKeys = Object.keys(this.virtualCache);
      if (currentHeapKeys.indexOf(memoryQueryOne) !== -1) {
         return this.virtualCache[memoryQueryOne];
         // If the operation is a union, the order does not matter.
      }
      else if ((operation === this.tokens.UNION_OP || operation === this.tokens.INTERSECTION_OP) && currentHeapKeys.indexOf(memoryQueryTwo) !== -1) {
         return this.virtualCache[memoryQueryTwo];
      }
      /**
       * Optimization
       */
      if (token1.uuid === token2.uuid) {
         if (operation === this.tokens.INTERSECTION_OP || operation === this.tokens.UNION_OP) {
            this.virtualCache[memoryQueryOne] = new VoxelCollection({
               controller: this.controller,
               fillVoxels: token1.getFillVoxels(),
               origin: token1.getOrigin()
            });
         }
         else if (operation === this.tokens.SUBTRACTION_OP || operation === this.tokens.SYMM_DIFF_OP) {
            // Do some pointer assignments so 
            this.virtualCache[memoryQueryOne] = new VoxelCollection({
               controller: this.controller,
               fillVoxels: [],
               origin: [0, 0, 0]
            });
         }
         return this.virtualCache[memoryQueryOne];
      }
      /**
       * Intersection Calculautions
       */
      let token1JointBox = token1.jointBoundingBox.getAllJointBoundingBoxes(JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY);
      let token2JointBox = token2.jointBoundingBox.getAllJointBoundingBoxes(JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY);
      let intersectionArr = [];
      for (let box1 of token1JointBox) {
         for (let box2 of token2JointBox) {
            // need to make these static
            let intersection = BoundingBox.boundingBoxIntersect(box1.boundingBoxPointData, box2.boundingBoxPointData);
            if (intersection[0]) {
               // Add these intersected sub box to the intersection box array.
               intersectionArr.push(new BoundingBox({
                  "boundingInputPayload": intersection[1],
                  "inputType": BoundingBoxPayloadModes.TYPE_BOUNDING_DIRECTORY
               }));
            }
         }
      }
      let intersectionJoint = new JointBoundingBox(intersectionArr);
      // What voxels from token 1 and 2 are in the overlapping. Only pulls from token 1 to prevent duplicates.
      let joint = [];
      // What are not in the joint. These coordinates could never overlap if both were unioned
      let token1NotInJoint = [];
      let token2NotInJoint = [];
      // Grab the voxels for each token
      let token1Voxels = token1.getFillVoxels();
      let token2Voxels = token2.getFillVoxels();
      console.log("Token1Voxels: "+JSON.stringify(token1Voxels))
      console.log("Token2Voxels: "+JSON.stringify(token2Voxels))
      for (let voxel of token1Voxels) {

         console.log("\nVoxel 1 in 2 "+JSON.stringify(voxel)+": "+token2.findPointFromObject(voxel))
         if (!intersectionJoint.isInside(voxel) || token2.findPointFromObject(voxel) === -1) {
            token1NotInJoint.push(voxel);
         }
         else {
            joint.push(voxel);
         }
      }
      for (let voxel of token2Voxels) {
         console.log("\nVoxel 2 in 1 "+JSON.stringify(voxel)+": "+token1.findPointFromObject(voxel))
         if (!intersectionJoint.isInside(voxel) || token1.findPointFromObject(voxel) === -1) {
            token2NotInJoint.push(voxel);
         }
      }
      let newFillVoxels = [];
      console.log("joint: "+JSON.stringify(joint))
      console.log("token1NotInJoint: "+JSON.stringify(token1NotInJoint))
      console.log("token2NotInJoint: "+JSON.stringify(token2NotInJoint))
      if (operation === this.tokens.INTERSECTION_OP) {
         if (joint.length === 0) {
            this.virtualCache[memoryQueryOne] = new VoxelCollection({
               controller: this.controller,
               fillVoxels: [],
               origin: [0, 0, 0]
            });
            return this.virtualCache[memoryQueryOne];
         }
         else {
            // Otherwise, the joint is valid and can be used for cache later on.
            newFillVoxels = joint;
         }
      }
      else if (operation === this.tokens.UNION_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
         BaseObject.push2D(token2NotInJoint, newFillVoxels);
         BaseObject.push2D(joint, newFillVoxels);
      }
      else if (operation === this.tokens.SUBTRACTION_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
      }
      else if (operation === this.tokens.SYMM_DIFF_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
         BaseObject.push2D(token2NotInJoint, newFillVoxels);
      }
      else {
         throw new ReferenceError("Unknown operation: " + operation);
      }
      this.virtualCache[memoryQueryOne] = new VoxelCollection({
         "controller": this.controller,
         "origin": [0, 0, 0],
         "fillVoxels": newFillVoxels
      });
      return this.virtualCache[memoryQueryOne];
   }
   interpretAST () {
      this.tokens = SetOperationsParser.getSymbols();
      this.resetVirtualCache();
      // This object is only temporary, but since it is the result from the recursive function, 
      // we can only remove the records after the stack collapse.
      let solvedASTJoint = this.#recursiveSolver(this.equationInstance.getAST(), 0);
      this._fillVoxels = solvedASTJoint._fillVoxels;
      // fill voxels has changed, so we need to calculaute bounding boxes again.
      this.calculateBoundingBox();
      solvedASTJoint.delete();
      return this;
   }
}
/**
 * Takes in a layer and a XYZ direction vector, and extrudes the layer in that direction.
 */
export class LayerVectorExtrude extends BaseObject {
   /**
    * The XYZ direction to extrude the voxel
    */
   extrudeVector;
   /**
    * The layer to be extruded
    */
   extrudeObject;
   /**
    * A Layer created by taking the extrude endpoints of the {@link extrudeObject._verticesArray}
    * Used to create the shell endpoint.
   */
   extrudeEndCap;
   /**
    * Defines if the current extruded shape is a shell (hollow) or not (filled)
    */
   shell;
   constructor(options) {
      super({
         "controller": options.controller,
         "origin": options.origin
      });
      this.extrudeVector = [...options.extrudeVector];
      this.extrudeObject = options.extrudeObject;
      this.extrudeEndCap = new Layer({
         "controller": options.controller,
         "origin": options.origin,
         "verticesArray": []
      });
      this.shell = false;
   }
   /**
    * Changes the extrude vector, resets the fillVoxels to extrudeObject's fillVoxels, sets endCap to no vertices, and sets shell to false.
    *
    * Re-calculates bounding box.
    *
    * @param newVector
    * @returns Reference to this object for method chaining.
    */
   changeExtrudeVector (newVector) {
      this.extrudeVector = [...newVector];
      this._fillVoxels = this.extrudeObject.getFillVoxels();
      this.extrudeEndCap.changeVertices([]);
      this.calculateBoundingBox();
      this.shell = false;
      return this;
   }
   /**
    * Changes the extruding object, resets the fillVoxels to this new object, resets extrudeEndCap to no vertices, sets shell to false,
    *
    * Re-calculautes bounding box.
    *
    * @param newObject New object to be extruded
    * @returns
    */
   changeExtrudeObject (newObject) {
      this.extrudeObject = newObject;
      this._fillVoxels = this.extrudeObject.getFillVoxels();
      this.extrudeEndCap.changeVertices([]);
      this.calculateBoundingBox();
      this.shell = false;
      return this;
   }
   /**
    * Generates the extrusion from the {@link LayerVectorExtrude.extrudeObject} by the XYZ vector {@link LayerVectorExtrude.extrudeVector}.
    *
    * Generates another layer, {@link LayerVectorExtrude.extrudeEndCap}, which is composed of all extruded vertices from te extrudeObject.
    *
    * Stores with fillVoxels, re-calculautes bounding box.
    *
    * @param shell If the extrusion should be hollow or not.
    * @returns
    */
   extrudeVoxels (shell) {
      this.shell = shell;
      if ((this.extrudeVector[0] + this.extrudeVector[1] + this.extrudeVector[2]) === 0) {
         this._fillVoxels = this.extrudeObject.getFillVoxels();
         this.calculateBoundingBox();
         this.extrudeEndCap.changeVertices(this.extrudeObject.getVerticeVoxels()).generateEdges().fillPolygon();
         return this;
      }
      this._fillVoxels = [];
      let endCapVertices = [];
      for (let voxel of this.extrudeObject.getVerticeVoxels()) {
         endCapVertices.push(voxel.map((n, i) => n += this.extrudeVector[i]));
      }
      this.extrudeEndCap.changeVertices(endCapVertices).generateEdges().fillPolygon();
      if (shell) {
         let edgeDirectoryVoxels = this.extrudeObject.getEdgeVoxels();
         if (edgeDirectoryVoxels.length === 0) {
            console.warn("extrudeVoxels error dectected, printing layer:");
            console.warn(this.extrudeObject);
            throw new ReferenceError("LayerVectorExtrude layer " + this.extrudeObject.uuid + " has no voxels within the edge directory.");
         }
         for (let voxel of edgeDirectoryVoxels) {
            BaseObject.push2D(BaseObject.graph3DParametric(...voxel, ...voxel.map((n, i) => n += this.extrudeVector[i])).slice(1, -1), this._fillVoxels);
         }
         BaseObject.push2D(this.extrudeEndCap.getFillVoxels(), this._fillVoxels);
         BaseObject.push2D(this.extrudeObject.getFillVoxels(), this._fillVoxels);
      }
      else {
         for (let voxel of this.extrudeObject.getFillVoxels()) {
            BaseObject.push2D(BaseObject.graph3DParametric(...voxel, ...voxel.map((n, i) => n += this.extrudeVector[i])), this._fillVoxels);
         }
      }
      this.calculateBoundingBox();
      return this;
   }
}
export var LayerConvexExtrudeEdgeDirectoryOptions;
(function (LayerConvexExtrudeEdgeDirectoryOptions) {
   LayerConvexExtrudeEdgeDirectoryOptions["RETURN_MODE_FULL_DIRECTORY"] = "RETURN_MODE_FULL_DIRECTORY";
   LayerConvexExtrudeEdgeDirectoryOptions["RETURN_MODE_VOXELS"] = "RETURN_MODE_VOXELS";
})(LayerConvexExtrudeEdgeDirectoryOptions || (LayerConvexExtrudeEdgeDirectoryOptions = {}));
/**
 * This extrusion takes in any amount of layers and creates a fluid extrusion between them via Convex Hulls.
 */
export class LayerConvexExtrude extends BaseObject {
   shell;
   /**
    * The layers to extrude between, where order matters.
    */
   extrudeObjects;
   /**
    * The extrusion is divided up into sections, with every two layer object grouped into one section.
    *
    * Each of these sections is stored as an indepedent VoxelCollection within the edgeDirectory.
    *
    * The voxels of each section overlap, so use {@link LayerConvexExtrude.getEdgeDirectory} to retrieve a duplicate free version.
    */
   edgeDirectory;
   constructor(options) {
      super({
         "controller": options.controller,
         "origin": options.origin
      });
      this.extrudeObjects = options.extrudeObjects;
      this.edgeDirectory = {};
      this.shell = false;
   }
   static pointOrientation (p1, p2, p3) {
      // If the slope from p1 to p2 is less than the slope from p2 to p3, 
      // then the points are trending counter clockwise. 
      return (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p3[1] - p2[1]) * (p2[0] - p1[0]);
   }
   static convexHull (inputPoints) {
      if (inputPoints.length <= 3) {
         return inputPoints;
      }
      // Sort the data set from lowest x value to highest
      let sortedPoints = inputPoints.sort((a, b) => a[0] - b[0]);
      let convexHull = [sortedPoints[0]];
      // Start with a point we know is on the hull
      let pointOnHull = sortedPoints[0];
      while (true) {
         for (let i = 1; i < sortedPoints.length; i++) {
            // Grab the potinal for the next point.
            let nextPoint = sortedPoints[i];
            // Loop back through again and confirm that this is the most counterclockwise point
            for (let j = 0; j < sortedPoints.length; j++) {
               // If a point on the hull is more counter clockwise than this current point
               if (LayerConvexExtrude.pointOrientation(pointOnHull, nextPoint, sortedPoints[j]) < 0) {
                  // This should be the next point instead
                  nextPoint = [...sortedPoints[j]];
                  // And that when we come back around for a new nextPoint, 
                  // don't go back over values already checked.
                  i = j;
               }
            }
            // If we have come back around
            if (JSON.stringify(nextPoint) === JSON.stringify(sortedPoints[0])) {
               return convexHull;
            }
            // After we found the new value of the nextPoint, add it to the hull

            convexHull.push([...nextPoint]);
            // Now we restart the loop again, with this new hull point.
            pointOnHull = [...nextPoint];
         }
      }
   }
   generateEdges (includeShapeEdges) {
      this.resetEdgeDirectory();
      // 1 2
      // 0 1
      // the coordinates of the line just made
      let sectionKey = 0;
      // The current Line
      let lineVoxelCollection = new VoxelCollection({
         "controller": this.controller,
         "origin": [0, 0, 0],
         "fillVoxels": []
      });
      // The computation median between the line and the current section
      let compositeMedian = new CompositeVoxelCollection({
         "controller": this.controller,
         "origin": [0, 0, 0],
         "variableNames": {},
         "log": false
      });
      // For all extrude objects
      for (let i = 0; i < this.extrudeObjects.length; i++) {
         if (i + 1 < this.extrudeObjects.length) {
            let startObject = this.extrudeObjects[i];
            let endObject = this.extrudeObjects[i + 1];
            // Create a new collection for this section of the extrude
            var sectionVoxelCollection = new VoxelCollection({
               "controller": this.controller,
               "origin": [0, 0, 0],
               "fillVoxels": []
            });
            // Change the composite medican varaibles to be the current section and the lines themself. 
            compositeMedian.changeNames({
               [sectionVoxelCollection.uuid]: sectionVoxelCollection,
               [lineVoxelCollection.uuid]: lineVoxelCollection,
            });
            // Set the equation to the this new section + the line varaible. 
           
            compositeMedian.setEquation(lineVoxelCollection.uuid + compositeMedian.tokens.SUBTRACTION_OP + sectionVoxelCollection.uuid);
            // reset it for each new section calculauted 
            lineVoxelCollection.setFillVoxels([]);
            // Extrude all vertices from start of section layer to end of section layer
            let startV = startObject.getVerticeVoxels();
            let endV = endObject.getVerticeVoxels();
            for (let SV of startV) {
               for (let EV of endV) {
                  // Set the fille voxels of the current lineCollection to the outputted line calculation
                  lineVoxelCollection.setFillVoxels(BaseObject.graph3DParametric(...SV, ...EV));
                  console.log("Generated Line: "+JSON.stringify(BaseObject.sortPoints(lineVoxelCollection.getFillVoxels()))+" From ["+SV+"] To ["+EV+"]")
                  // THen, add these new voxels to the section, removing duplicates by subtracting.
                  sectionVoxelCollection.addFillVoxels(compositeMedian.interpretAST().getFillVoxels());
                 console.log("New Section Voxels: "+JSON.stringify(BaseObject.sortPoints(sectionVoxelCollection.getFillVoxels()))+"\n\n\n")
               }
            }
            // Now generate the convex hull for this group of voxels.
            let newFillVoxel = [];
            let boundingBoxMetaReference;
            for (let key of Object.keys(sectionVoxelCollection.sortedFillVoxelsDirectory)) {
               let convexCoords = BaseObject.deepCopy(sectionVoxelCollection.sortedFillVoxelsDirectory[Number(key)]);
               boundingBoxMetaReference = sectionVoxelCollection.boundingBoxMeta;
               convexCoords = convexCoords.map((v) => v.filter((c, index) => index != boundingBoxMetaReference.biggestRangeIndex[0]));
               convexCoords = LayerConvexExtrude.convexHull(convexCoords);
               convexCoords = convexCoords.map((v) => { return v.splice(boundingBoxMetaReference.biggestRangeIndex[0], 0, Number(key)), v; });
               BaseObject.push2D(convexCoords, newFillVoxel);
            }
            // Saves n time complexity by directly setting the newFillVoxels as a pointer in memory
            // Know we can gurantee that each sectionVoxelCollection.sortedFillVoxelsDirectory[key] is a convex hull for extrude
            sectionVoxelCollection._fillVoxels = newFillVoxel;
            sectionVoxelCollection.calculateBoundingBox();
            // Saves these voxels
            this.edgeDirectory[sectionKey] = sectionVoxelCollection;
            sectionKey++;
            if (includeShapeEdges) {
               let endEdgeVoxels = new VoxelCollection({
                  "controller": this.controller,
                  "origin": [0, 0, 0],
                  "fillVoxels": endObject.getEdgeVoxels()
               })
               let startEdgeVoxels = new VoxelCollection({
                  "controller": this.controller,
                  "origin": [0, 0, 0],
                  "fillVoxels": startObject.getEdgeVoxels()
               })
               console.log("--> Adding End Voxels <--")
               compositeMedian.changeNames({
                  [sectionVoxelCollection.uuid]: sectionVoxelCollection,
                  [lineVoxelCollection.uuid]: lineVoxelCollection,
                  [endEdgeVoxels.uuid]: endEdgeVoxels
               }).setEquation(endEdgeVoxels.uuid + compositeMedian.tokens.SUBTRACTION_OP + sectionVoxelCollection.uuid);
               sectionVoxelCollection.addFillVoxels(compositeMedian.interpretAST().getFillVoxels());
               compositeMedian.changeNames({
                  [sectionVoxelCollection.uuid]: sectionVoxelCollection,
                  [lineVoxelCollection.uuid]: lineVoxelCollection,
                  [startEdgeVoxels.uuid]: startEdgeVoxels
               }).setEquation(startEdgeVoxels.uuid + compositeMedian.tokens.SUBTRACTION_OP + sectionVoxelCollection.uuid);
               sectionVoxelCollection.addFillVoxels(compositeMedian.interpretAST().getFillVoxels());
               endEdgeVoxels.delete();
               startEdgeVoxels.delete();
            }
         }
      }
      // Once we are done, combine all of the information into fillVoxels
      let equation = "";
      let fillVoxelNamesAllSections = {};
      let keys = Object.keys(this.edgeDirectory);
      for (let i = 0; i < keys.length; i++) {
         let key = keys[i];
         equation += this.edgeDirectory[key].uuid;
         fillVoxelNamesAllSections[this.edgeDirectory[key].uuid] = this.edgeDirectory[key];
         if (i + 1 !== keys.length) {
            equation += compositeMedian.tokens.UNION_OP;
         }
      }
      compositeMedian.changeNames(fillVoxelNamesAllSections);
      BaseObject.push2D(compositeMedian.setEquation(equation).interpretAST().getFillVoxels(), this._fillVoxels);
      compositeMedian.delete();
      lineVoxelCollection.delete();
      this.calculateBoundingBox();
      return this;
   }
   getEdgeDirectory (mode) {
      if (mode === LayerConvexExtrudeEdgeDirectoryOptions.RETURN_MODE_FULL_DIRECTORY) {
         let output = {};
         for (let key of Object.keys(this.edgeDirectory)) {
            output[key] = this.edgeDirectory[key].getFillVoxels();
         }
         return output;
      }
      else if (mode === LayerConvexExtrudeEdgeDirectoryOptions.RETURN_MODE_VOXELS) {
         return [];
      }
      else {
         throw new ReferenceError("Invalid getEdgeDirectory mode, must be either 'RETURN_MODE_FULL_DIRECTORY' or 'RETURN_MODE_VOXELS'");
      }
   }
   resetEdgeDirectory () {
      this.shell = false;
      this._fillVoxels = [];
      for (let key of Object.keys(this.edgeDirectory)) {
         this.edgeDirectory[key].delete();
         delete this.edgeDirectory[key];
      }
      return this;
   }
}
