/**
   * @remarks
   * Specifies the various modes of how data is retrieved for {@link JointBoundingBox.getAllJointBoundingBoxes}
   */
export enum JointBoundingBoxActions {
   /**
    * Specifies that the return type should be an array of every {@link BoundingBox}
    * @remarks
    * Is exactly the same as {@link JointBoundingBox.boundingBoxes}
    */
   RETURN_MODE_FULL_DIRECTORY = "RETURN_MODE_FULL_DIRECTORY",
   /**
   * Specifies that the return type should be an array of every {@link BoundingBox.boundingBox}.
   */
   RETURN_MODE_VOXELS_DIRECTORY = "RETURN_MODE_VOXELS_DIRECTORY",
   /**
    * Compiles all each of the {@link BoundingBox.boundingBox} into an 2D array of {@link Voxel}. These voxels represent all of the corners of all of the stored boxes.
    */
   RETURN_MODE_VOXELS = "RETURN_MODE_VOXELS"
}

/**
 * A single XYZ Point
 */
export type Voxel = [number, number, number];

/**
 * Valid corner keys for {@link PartialBoundingBox} and {@link CompleteBoundingBox}
 */
export type VALID_BOUNDING_KEY = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7"

/**
 * Holds the data for the corners of a rectangle. This data type is to be used when the box is incomplete with one or more corner data missing.
 * 
 * @remarks
 * This type is used for internal calculations of {@link BoundingBox}. The intersection of two boxes may produce a partial box, requiring correction.
 * 
 */
export interface PartialBoundingBox {
   "0": Voxel | [],
   "1": Voxel | [],
   "2": Voxel | [],
   "3": Voxel | [],
   "4": Voxel | [],
   "5": Voxel | [],
   "6": Voxel | [],
   "7": Voxel | []
}
/**
 * Used by {@link BaseObject} to represent a Bounding Box that surronds no Voxels.
 */
export interface ZeroVolumeBoundingBox {
   boundingBox: {
      "0": [],
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
      "6": [],
      "7": []
   }
}
/**
 * Holds the data for the corners of a rectangle. This data type is to be used when the box is complete.
 * 
*/
export interface CompleteBoundingBox {
   "0": Voxel,
   "1": Voxel,
   "2": Voxel,
   "3": Voxel,
   "4": Voxel,
   "5": Voxel,
   "6": Voxel,
   "7": Voxel
}

/**
 * Holds an array of one or more {@link BoundingBox}, and treats them as one box. 
 * 
 * @remarks
 * When a single box is used to outline the entire 3D space a shape takes up, large voids may appear. For example, encasing a diagonal line in a sqaure leaves mostly empty space.
 * 
 * Instead, slice the line into smaller pieces and encase each slice in its own box. Then put all of those slices in a single data structure that treats it as one continuous space boundary.
 */
export class JointBoundingBox {
   boundingBoxes: BoundingBox[] = [];
   constructor(boxes: BoundingBox[]) {
      this.boundingBoxes = boxes;
   }
   /**
    * Decides if a given point is in any of the internally stored boxes
    * @param point XYZ Value
    * @returns True if inside, false if it is not.
    */
   isInside(point: Voxel): boolean {
      if (this.boundingBoxes.length === 0) {
         return false;
      }
      for (let i = 0; i < this.boundingBoxes.length; i++) {
         if (BoundingBox.isInside(point, this.boundingBoxes[i].boundingBox as CompleteBoundingBox)) {
            return true;
         }
      }
      return false;
   }
   /**
    * @param mode A mode from JointBoundingBoxActions
    * @returns An array of data about each of the {@link JointBoundingBox.boundingBoxes}
    */
   getAllJointBoundingBoxes(mode: keyof typeof JointBoundingBoxActions): (BoundingBox | Voxel | CompleteBoundingBox)[] {
      return this.boundingBoxes.reduce<(Voxel | CompleteBoundingBox | BoundingBox)[]>((prev, curr) => {
         if (mode === JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY) {
            return prev.push(JSON.parse(JSON.stringify(curr))), prev;
         } else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS_DIRECTORY) {
            return prev.push(JSON.parse(JSON.stringify(curr.boundingBox))), prev;
         } else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS) {
            return prev.push(...BoundingBox.compileBoundingDirectory(curr.boundingBox as CompleteBoundingBox)), prev;
         } else {
            throw new TypeError("Invalid Mode");
         }
      }, [])
   }
}

/**
 * Options to be used for {@link BoundingBox}
 */
export interface BoundingBoxOptions {
   /**
    * Given data is in the form of another bounding box or an array of voxels to form a box around. 
    */
   boundingInputPayload: CompleteBoundingBox | Voxel[],
   /**
    * Specifies how to treat the data via {@link BoundingBoxPayloadModes}
    */
   inputType: BoundingBoxPayloadModes
}
/**
 * Specifies the input payload type for {@link BoundingBox}
 */
export enum BoundingBoxPayloadModes {
   /**
    * Specifies that the incoming payload is a {@link BoundingBox.boundingBox}.
    * 
    * @remarks
    * This type is most commonly used to copy a {@link BoundingBox}.
   */
   TYPE_BOUNDING_DIRECTORY = "TYPE_BOUNDING_DIRECTORY",
   /**
    * Specifies that the incoming payload is an array of {@link Voxel} to construct a box around.
    * 
    * @remarks
    * This type is most commonly used for {@link BaseObject._fillVoxels}. Take all of the voxels of a given shape and decide the bounds.
    */
   TYPE_BOUNDING_POINTS = "TYPE_BOUNDING_POINTS"
}

export class BoundingBox {

   static BOX_VERTICE_COUNT = 8;

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
   boundingBox: CompleteBoundingBox = {
      "0": [0, 0, 0],
      "1": [0, 0, 0],
      "2": [0, 0, 0],
      "3": [0, 0, 0],
      "4": [0, 0, 0],
      "5": [0, 0, 0],
      "6": [0, 0, 0],
      "7": [0, 0, 0],
   }
   /**
    * The coordinate of the lowest Y value that the current {@link BoundingBox.boundingBox} contains.
    */
   yLow: number = -1;
   /**
    * The coordinate of the highest Y value that the current {@link BoundingBox.boundingBox} contains.
    */
   yHigh: number = -1;
   /**
    * The coordinate of the lowest X value that the current {@link BoundingBox.boundingBox} contains.
    */
   xLow: number = -1;
   /**
    * The coordinate of the highest X value that the current {@link BoundingBox.boundingBox} contains.
    */
   xHigh: number = -1;
   /**
    * The coordinate of the lowest Z value that the current {@link BoundingBox.boundingBox} contains.
    */
   zLow: number = -1;
   /**
    * The coordinate of the highest Z value that the current {@link BoundingBox.boundingBox} contains.
    */
   zHigh: number = -1;
   /**
    * The distance between the xLow and xHigh (abs)
    */
   xRange: number = -1;
   /**
    * The distance between the yLow and yHigh (abs)
    */
   yRange: number = -1;
   /**
    * The distance between the zLow and zHigh (abs)
    */
   zRange: number = -1;
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
   biggestRangeLabaled: string[] = [];
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
   biggestRangeIndex: number[] = [];
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
   biggestRangeLabaledLow: string[] = [];
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
   biggestRangeLabaledHigh: string[] = [];

   /**
    * @remarks
    * Automatically calls {@link BoundingBox.calculateRange} to generate all required metadata.
    * @param options 
    */
   constructor(options: BoundingBoxOptions) {
      if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_DIRECTORY) {
         this.setBoundingBox(options.boundingInputPayload as CompleteBoundingBox);
      } else if (options.inputType === BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS) {
         this.createBoundingBox(options.boundingInputPayload as Voxel[]);
      }
   }
   static getEmptyBoundingTemplate(): PartialBoundingBox {
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
   setBoundingBox(boundingBoxStructure: CompleteBoundingBox): void {
      for (let i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
         let key = String(i) as VALID_BOUNDING_KEY
         this.boundingBox[key] = [...boundingBoxStructure[key]];
      }
      this.calculateRange(BoundingBox.compileBoundingDirectory(boundingBoxStructure))
   }
   /**
    * Checks if a given point falls within the 3D space this box covers.
    * @param arr The given XYZ Point
    * @param b2 The bounding box to check
    * @returns True if inside, false if not.
    */
   static isInside(arr: Voxel, b2: CompleteBoundingBox): boolean {
      return (arr[0] >= b2[0][0] &&
         arr[0] <= b2[1][0] &&
         arr[1] >= b2[0][1] &&
         arr[1] <= b2[2][1] &&
         arr[2] >= b2[0][2] &&
         arr[2] <= b2[4][2])
   }
   /**
    * @remarks
    * Used by {@link JointBoundingBox}
    * @param b3 The Bounding Box corner directory
    * @returns An array of all of the corner voxels.
    */
   static compileBoundingDirectory(b3: CompleteBoundingBox): Voxel[] {
      let voxels: Voxel[] = []
      for (let i = 0; i < BoundingBox.BOX_VERTICE_COUNT; i++) {
         let key = String(i) as VALID_BOUNDING_KEY
         if (b3[key].length === 3) {
            voxels.push([...b3[key]])
         }
      }
      return voxels
   }
   /**
    * Calculates all of the metadata based for the current {@link BoundingBox.boundingBox}. This includes the point extremes and ranges on all three axes.
    * @param array2D 
    */
   calculateRange(array2D: Voxel[]): void {
      let xValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[0]), prev }, []).sort((a, b) => a - b)
      let yValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[1]), prev }, []).sort((a, b) => a - b)
      let zValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[2]), prev }, []).sort((a, b) => a - b)
      this.xLow = xValues[0]
      this.xHigh = xValues[xValues.length - 1]
      this.yLow = yValues[0]
      this.yHigh = yValues[yValues.length - 1]
      this.zLow = zValues[0]
      this.zHigh = zValues[zValues.length - 1]
      this.zRange = Math.abs(this.zHigh - this.zLow)
      this.yRange = Math.abs(this.yHigh - this.yLow)
      this.xRange = Math.abs(this.xHigh - this.xLow);
      const rangeKey: Record<string, { v: number, i: number }> = {
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
      }
      this.biggestRangeLabaled = ["xRange", "yRange", "zRange"].sort((a: string, b: string) => rangeKey[b].v - rangeKey[a].v)
      this.biggestRangeLabaledLow = this.biggestRangeLabaled.map(n => n.replace("Range", "Low"))
      this.biggestRangeLabaledHigh = this.biggestRangeLabaled.map(n => n.replace("Range", "High"))
      this.biggestRangeIndex = this.biggestRangeLabaled.map(n => rangeKey[n].i)
   }
   /**
    * Creates a new bounding box that encompasses a group of points. Stores internally as {@link BoundingBox.boundingBox}. Automatically calculates range via {@link BoundingBox.calculateRange}
    * @param array2D 
    */
   createBoundingBox(array2D: Voxel[]): void {
      if (array2D.length > 0) {
         this.calculateRange(array2D);
         this.boundingBox[0] = [this.xLow, this.yLow, this.zLow]
         this.boundingBox[1] = [this.xHigh, this.yLow, this.zLow]
         this.boundingBox[2] = [this.xLow, this.yHigh, this.zLow]
         this.boundingBox[3] = [this.xHigh, this.yHigh, this.zLow]
         this.boundingBox[4] = [this.xLow, this.yLow, this.zHigh]
         this.boundingBox[5] = [this.xHigh, this.yLow, this.zHigh]
         this.boundingBox[6] = [this.xLow, this.yHigh, this.zHigh]
         this.boundingBox[7] = [this.xHigh, this.yHigh, this.zHigh]
      } else {
         throw new RangeError("Invalid BoundingBox.createBoundingBox argument: array2D must contain at least one XYZ voxel.")
      }
   }
   /**
    * Returns the amount of entries within a {@link PartialBoundingBox} that are valid {@link Voxel}, used by the {@link BoundingBox.correctBoundingBox} method.
    * @param b3 Bounding Box
    * @returns Count
    */
   static findEntryCount(b3: PartialBoundingBox) {
      let entryCount = 0;
      for (let i in b3) {
         if (b3[i as VALID_BOUNDING_KEY].length > 0) {
            entryCount++;
         }
      }
      return entryCount;
   }
   /**
   * @remarks Checks if a horizontal line, ranging from positive to negative infinity on the x-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
   * @param  V Given Point
   * @param BL Bottom left of plane
   * @param  BR Bottom right of plane
   * @param  UL Upper left of plane
   * @returns True if the vector passes through, false otherwise.
   */
   static horizontalCheck(V: Voxel, BL: Voxel, BR: Voxel, UL: Voxel): boolean {
      return (V[2] >= BL[2] && V[2] <= BR[2] && V[1] >= BL[1] && V[1] <= UL[1]);
   }
   /**
    * @remarks Checks if a vertical line, ranging from positive to negative infinity on the y-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
    * @param  V Given Point
    * @param  BL Bottom left of plane
    * @param  BR Bottom right of plane
    * @param UL Upper left of plane
    * @returns True if the vector passes through, false otherwise.
    */
   static verticalCheck(V: Voxel, BL: Voxel, BR: Voxel, UL: Voxel): boolean {
      return (V[0] >= BL[0] && V[0] <= BR[0] && V[2] <= UL[2] && V[2] >= BL[2]);
   }
   /**
  * @remarks Checks if a depth line, ranging from positive to negative infinity on the z-axis, that passes through a given voxel V, will intersect the rectangular plane defined by voxels BL, BR, and UL.
  * @param  V Given Point
  * @param BL Bottom left of plane
  * @param  BR Bottom right of plane
  * @param  UL Upper left of plane
  * @returns True if the vector passes through, false otherwise.
  */
   static depthCheck(V: Voxel, BL: Voxel, BR: Voxel, UL: Voxel): boolean {
      return (V[0] >= BL[0] && V[0] <= BR[0] && V[1] <= UL[1] && V[1] >= BL[1]);
   }
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
   static #VP = [
      [[0, 1], [2, 3], [6, 7], [4, 5]],
      [[0, 2], [1, 3], [4, 6], [5, 7]],
      [[2, 6], [3, 7], [0, 4], [1, 5]]
   ];
   /**
   * @remarks Generates a new {@link CompleteBoundingBox} or {@link PartialBoundingBox} from the intersection between two inputted boxes. 
   * 
   * Used to find the cubic range area that is shared between two boxes, if any.
   * 
   * @param b1 Box 1
   * @param b2 Box 2
   * @returns Returns an array, and if the first element is true, then the second element is the intersection {@link CompleteBoundingBox}. 
   * 
   * Otherwise, the intersection is not possible (false) and the second element will be a {@link PartialBoundingBox}. This partial box will be the method's best attempt to {@link BoundingBox.correctBoundingBox}.
   */
   static boundingBoxIntersect(b1: CompleteBoundingBox | PartialBoundingBox, b2: CompleteBoundingBox | PartialBoundingBox): [boolean, CompleteBoundingBox | PartialBoundingBox] {
      const b3: PartialBoundingBox = BoundingBox.getEmptyBoundingTemplate()
      if (BoundingBox.findEntryCount(b1) < 8) {
         b1 = BoundingBox.correctBoundingBox(b1)[1]
         if (BoundingBox.findEntryCount(b1) < 8) {
            return [false, BoundingBox.getEmptyBoundingTemplate()]
         }
      } else if (BoundingBox.findEntryCount(b2) < 8) {
         b2 = BoundingBox.correctBoundingBox(b2)[1]
         if (BoundingBox.findEntryCount(b2) < 8) {
            return [false, BoundingBox.getEmptyBoundingTemplate()]
         }
      }
      // Despite B1 being now a valid CompleteBoundingBox, since the inital input of it was a OR type, I can not access the box.
      // So I must re-create the boxes as a new strict type 
      let assertedB1 = b1 as CompleteBoundingBox
      let assertedB2 = b2 as CompleteBoundingBox
      for (let xp of this.#VP[0]) {
         // check if b1 is inside b2
         // if xp0 and xp1's vectors extending infitly in x direction,
         // pass through planes defined by 0,4,2 and 1,5,3
         let left = BoundingBox.horizontalCheck(assertedB1[xp[0] + "" as VALID_BOUNDING_KEY], assertedB2[0], assertedB2[2], assertedB2[4]);
         let right = BoundingBox.horizontalCheck(assertedB1[xp[1] + "" as VALID_BOUNDING_KEY], assertedB2[1], assertedB2[3], assertedB2[5]);
         if (left && right) {
            // b1-left-x <= b2-0-x
            if (assertedB1[xp[0] + "" as VALID_BOUNDING_KEY][0] <= assertedB2[0][0]) {
               // b3-left = b2-0-x, b1-left-y, b1-left-z
               b3[xp[0] + "" as VALID_BOUNDING_KEY] = [assertedB2[0][0], assertedB1[xp[0] + "" as VALID_BOUNDING_KEY][1], assertedB1[xp[0] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-left = b1-left
               b3[xp[0] + "" as VALID_BOUNDING_KEY] = [...assertedB1[xp[0] + "" as VALID_BOUNDING_KEY]];
            }
            // b1-right-x >= b2-right-x
            if (assertedB1[xp[1] + "" as VALID_BOUNDING_KEY][0] >= assertedB2[1][0]) {
               // b3-right = b2-right-x, b1-right-y, b1-right-z
               b3[xp[1] + "" as VALID_BOUNDING_KEY] = [assertedB2[1][0], assertedB1[xp[1] + "" as VALID_BOUNDING_KEY][1], assertedB1[xp[1] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-right = b1-right
               b3[xp[1] + "" as VALID_BOUNDING_KEY] = [...assertedB1[xp[1] + "" as VALID_BOUNDING_KEY]];
            }
         }
      }
      for (let yp of this.#VP[1]) {
         // if down's vectors extends through plane 0, 1, 4
         let down = BoundingBox.verticalCheck(assertedB1[yp[0] + "" as VALID_BOUNDING_KEY], assertedB2[0], assertedB2[1], assertedB2[4]);
         // if ups vectors extends through plane 2, 3, 6
         let up = BoundingBox.verticalCheck(assertedB1[yp[1] + "" as VALID_BOUNDING_KEY], assertedB2[2], assertedB2[3], assertedB2[6]);
         if (up && down) {
            // b1-down-y >= b2-2-y
            if (assertedB1[yp[0] + "" as VALID_BOUNDING_KEY][1] <= assertedB2[1][1]) {
               // b3-down = b1-down-x, b2-0-y, b1-down-z
               b3[yp[0] + "" as VALID_BOUNDING_KEY] = [assertedB1[yp[0] + "" as VALID_BOUNDING_KEY][0], assertedB2[0][1], assertedB1[yp[0] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-down = b1-down
               b3[yp[0] + "" as VALID_BOUNDING_KEY] = [...assertedB1[yp[0] + "" as VALID_BOUNDING_KEY]]
            }
            // b1-up-y >= b2-2-y
            if (assertedB1[yp[1] + "" as VALID_BOUNDING_KEY][1] >= assertedB2[2][1]) {
               // b3-up = b1-up-x, b2-0-y, b1-up-z
               b3[yp[1] + "" as VALID_BOUNDING_KEY] = [assertedB1[yp[1] + "" as VALID_BOUNDING_KEY][0], assertedB2[2][1], assertedB1[yp[1] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-up = b2-up
               b3[yp[1] + "" as VALID_BOUNDING_KEY] = [...assertedB1[yp[1] + "" as VALID_BOUNDING_KEY]]
            }
         }
      }
      for (let zp of this.#VP[2]) {
         // if closet point vector extends through plane 4,5,6
         let closet = BoundingBox.depthCheck(assertedB1[zp[0] + "" as VALID_BOUNDING_KEY], assertedB2[0], assertedB2[1] as Voxel, assertedB2[2]);
         // if farthest points vector extends through 0,1,2
         let further = BoundingBox.depthCheck(assertedB1[zp[1] + "" as VALID_BOUNDING_KEY], assertedB2[4], assertedB2[5] as Voxel, assertedB2[6]);
         // if both these poins align through the planes
         if (closet && further) {
            // b1-close-z <= b2-0-z
            if (assertedB1[zp[0] + "" as VALID_BOUNDING_KEY][2] <= assertedB2[0][2]) {
               // b3-close = close-x, close-y b2-0-z
               b3[zp[0] + "" as VALID_BOUNDING_KEY] = [assertedB1[zp[0] + "" as VALID_BOUNDING_KEY][0], assertedB1[zp[0] + "" as VALID_BOUNDING_KEY][1], assertedB2[0][2]]
            } else {
               // b3-close = b1-close
               b3[zp[0] + "" as VALID_BOUNDING_KEY] = [...assertedB1[zp[1] + "" as VALID_BOUNDING_KEY]]
            }
            // b1-far-z >= b2-6-2
            if (assertedB1[zp[1] + "" as VALID_BOUNDING_KEY][2] >= assertedB2[6][2]) {
               // b3-far = far-x. far-y. b2-6-z
               b3[zp[1] + "" as VALID_BOUNDING_KEY] = [assertedB1[zp[1] + "" as VALID_BOUNDING_KEY][0], assertedB1[zp[1] + "" as VALID_BOUNDING_KEY][1], assertedB2[6][2]]
            }
         }
      }
      return BoundingBox.correctBoundingBox(b3)
   }
   /**
    * Checks if all of the given vertice numbers are defined within {@link BoundingBox.boundingBox} b3 (valid {@link Voxel}). 
    * 
    * @remarks Used internally by {@link BoundingBox.correctBoundingBox}. Can also be used to tell if a given {@link PartialBoundingBox} can be casted to a {@link CompleteBoundingBox}
    * 
    * @param b3 
    * @param args List of vertices to check if all are defined
    * @returns True if all are defined, false otherwise.
    */
   static isDef = (b3: CompleteBoundingBox | PartialBoundingBox, args: number[]) => {
      for (let i = 0; i < args.length; i++) {
         if (b3[args[i] + "" as VALID_BOUNDING_KEY].length === 0) {
            return false
         }
      }
      return true;
   }
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
   static correctBoundingBox(b3: PartialBoundingBox | CompleteBoundingBox): [boolean, CompleteBoundingBox | PartialBoundingBox] {
      let entryCount = BoundingBox.findEntryCount(b3);
      // first, check if the object only shares one corner
      if (entryCount <= 1) {
         return [false, b3]
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
         return [false, b3]
      }
      while (entryCount < 8) {
         // Calculate top planes
         // 7 --> 2
         // If indices 6 and 3 are not defined (demorgans law) and 7 and 2 are defined
         if (!BoundingBox.isDef(b3, [6, 3]) && BoundingBox.isDef(b3, [7, 2])) {
            b3[3] = [b3[7][0], b3[7][1], b3[2][2]] as Voxel; // QA
            b3[6] = [b3[2][0], b3[2][1], b3[7][2]] as Voxel; // QA
         }
         // 6 --> 3
         if (!BoundingBox.isDef(b3, [2, 7]) && BoundingBox.isDef(b3, [6, 3])) {
            b3[2] = [b3[6][0], b3[6][1], b3[3][2]] as Voxel; // QA
            b3[7] = [b3[3][0], b3[3][1], b3[6][2]] as Voxel; // QA
         }
         // calculate bottom planes
         // 5 -> 0
         if (!BoundingBox.isDef(b3, [4, 1]) && BoundingBox.isDef(b3, [5, 0])) {
            b3[4] = [b3[0][0], b3[0][1], b3[5][2]] as Voxel; // QA
            b3[1] = [b3[5][0], b3[5][1], b3[0][2]] as Voxel; // QA
         }
         // 4 --> 1
         if (!BoundingBox.isDef(b3, [5, 0]) && BoundingBox.isDef(b3, [4, 1])) {
            b3[5] = [b3[1][0], b3[1][1], b3[4][2]] as Voxel; // QA
            b3[0] = [b3[4][0], b3[4][2], b3[1][2]] as Voxel; // QA 
         }
         // calculate front plane
         // 3 -> 0
         if (!BoundingBox.isDef(b3, [2, 1]) && BoundingBox.isDef(b3, [3, 0])) {
            b3[2] = [b3[0][0], b3[3][1], b3[3][2]] as Voxel; // QA
            b3[1] = [b3[3][0], b3[0][1], b3[0][2]] as Voxel; // QA
         }
         // 2 --> 1  
         if (!BoundingBox.isDef(b3, [3, 0]) && BoundingBox.isDef(b3, [2, 1])) {
            b3[3] = [b3[1][0], b3[2][1], b3[2][2]] as Voxel; // QA
            b3[0] = [b3[2][0], b3[1][1], b3[1][2]] as Voxel; // QA
         }
         // calculate 4 -> 7
         // back plane
         if (!BoundingBox.isDef(b3, [5, 6]) && BoundingBox.isDef(b3, [4, 7])) {
            b3[5] = [b3[7][0], b3[4][1], b3[4][2]] as Voxel; // QA
            b3[6] = [b3[4][0], b3[7][1], b3[7][2]] as Voxel; // QA
         }
         // 5 --> 6
         if (!BoundingBox.isDef(b3, [4, 7]) && BoundingBox.isDef(b3, [5, 6])) {
            b3[4] = [b3[6][0], b3[5][1], b3[5][2]] as Voxel; // QA
            b3[7] = [b3[5][0], b3[6][1], b3[6][2]] as Voxel; // QA 
         }
         // calculate left plane
         // 6 -> 0
         if (!BoundingBox.isDef(b3, [2, 4]) && BoundingBox.isDef(b3, [6, 0])) {
            b3[2] = [b3[0][0], b3[6][1], b3[0][2]] as Voxel; // QA
            b3[4] = [b3[6][0], b3[0][1], b3[6][2]] as Voxel; // QA
         }
         // 2 --> 4
         if (!BoundingBox.isDef(b3, [6, 0]) && BoundingBox.isDef(b3, [2, 4])) {
            b3[6] = [b3[2][0], b3[2][1], b3[4][2]] as Voxel; // QA
            b3[0] = [b3[2][0], b3[4][1], b3[2][2]] as Voxel; // QA 
         }
         // calculate right plane
         // 3 --> 5
         if (!BoundingBox.isDef(b3, [7, 1]) && BoundingBox.isDef(b3, [3, 5])) {
            b3[7] = [b3[3][0], b3[3][1], b3[5][2]] as Voxel; // QA
            b3[1] = [b3[3][0], b3[5][1], b3[3][2]] as Voxel; // QA
         }
         // 1 -> 7
         if (!BoundingBox.isDef(b3, [3, 5]) && BoundingBox.isDef(b3, [7, 1])) {
            b3[3] = [b3[1][0], b3[7][1], b3[1][2]] as Voxel; // QA
            b3[5] = [b3[1][0], b3[1][1], b3[7][2]] as Voxel; // QA
         }
         if (!BoundingBox.isDef(b3, [4, 4]) && BoundingBox.isDef(b3, [7, 0])) {
            b3[4] = [b3[0][0], b3[0][1], b3[7][2]] as Voxel; // QA
         }
         // 1 -> 6
         if (!BoundingBox.isDef(b3, [2, 2]) && BoundingBox.isDef(b3, [1, 6])) {
            b3[2] = [b3[6][0], b3[6][1], b3[1][2]] as Voxel; // QA
         }
         // 2 --> 5
         if (!BoundingBox.isDef(b3, [3, 3]) && BoundingBox.isDef(b3, [2, 5])) {
            b3[3] = [b3[5][0], b3[2][1], b3[2][2]] as Voxel; // QA
         }
         // 4 --> 3
         if (!BoundingBox.isDef(b3, [6, 6]) && BoundingBox.isDef(b3, [4, 3])) {
            b3[6] = [b3[4][0], b3[3][1], b3[4][2]] as Voxel; // QA
         }
         entryCount = BoundingBox.findEntryCount(b3);
      }
      return [true, b3]
   }
}

/**
 * A controller for all of the universally unique identifications within the program. Contains a database where objects can choose to attatch a reference for each ID.
 * 
 * @remarks 
 */
export class UUIDController {
   /**
    * A database where the key is the UUID, and the object is the reference in memory.
    */
   _objIDReferance: Record<string, Object>
   /**
    * A list of all UUID's managed by this controller
    */
   #arrID: string[]
   constructor() {
      this.#arrID = []
      this._objIDReferance = {}
   }
   /**
    * 
    * @returns A random unicode character between either 47 to 57 decimal (U+0030 - U+0039) or 97 to 122 (U+0061 - U+007A)
    */
   _randomChar(): string {
      let choice = Math.random() > 0.5
      return String.fromCodePoint(Math.floor(Math.random() * (choice ? 26 : 10) + (choice ? 97 : 48)))
   }
   /**
    * Generates a new 36 character UUID
    * 
    * @remarks Does not check if this UUID is already within {@link UUIDController.#arrID} nor does it add it to the list.
    * 
    * @returns UUID
    */
   #generateID(): string {
      let uuid = ""
      for (let i = 1; i < 37; i++) {
         uuid += this._randomChar()
      }
      return uuid
   }
   /**
    * Adds a new reference to the {@link UUIDController._objIDReferance} database.
    * @param id The UUID
    * @param reference Object reference
    */
   setReferenceEntry(id: string, reference: Object) {
      this._objIDReferance[id] = reference;
   }
   /**
    * Removes the key/value pair via delete within the {@link UUIDController._objIDReferance} database.
    * 
    * @example 
    * delete this._objIDReferance[id]
    * 
    * @param id Target key via UUID
    */
   removeReferenceEntry(id: string) {
      delete this._objIDReferance[id]
   }
   /**
    * Generates a new 36 character UUID and is added to {@link UUIDController.#arrID}.
    * 
    * @returns A new UUID
    */
   getNewID(): string {
      let id = this.#generateID()
      while (this.#arrID.indexOf(id) !== -1) {
         id = this.#generateID()
      }
      this.#arrID.push(id);
      return id
   }
   /**
    * Removes the UUID from the controller's memory
    * @param id UUID to remove
    * @returns A mutation free copy of all of the ID's 
    */
   removeID(id: string) {
      this.#arrID = this.#arrID.filter(n => id !== n)
      delete this._objIDReferance[id]
      return [...this.#arrID];
   }
   /**
    * @returns A mutation free copy of all of the ID's 
    */
   getAllID(): string[] {
      return [...this.#arrID];
   }
   /**
    * @param id UUID to add
    * @returns True if this ID could be added, false if it was a duplicate and could not be added.
    */
   addID(id: string): boolean {
      if (this.#arrID.indexOf(id) === -1) {
         this.#arrID.push(id)
         return true;
      }
      return false
   }
   /**
    * Resets {@link UUIDController.#arrID} to an empty array.
    */
   clearAllID(): void {
      this.#arrID = []
   }
}

/**
 * Used internally by {@link BaseObject.graph3DParametric} to determine if a axes should increase, decrease, or stay the same.
 */
interface qChangeInterface {
   x: 1 | 0 | -1,
   y: 1 | 0 | -1,
   z: 1 | 0 | -1
}

/**
 * Valid options object for {@link BaseObject}.
 * 
 * @remarks
 * This data is to be supered by the subclass, as BaseObject is meant to be extended.
 */
export interface BaseObjectOptions {
   "controller": UUIDController,
   "origin": Voxel,
}


/**
 * The return type of {@link BaseObject.sortFillVoxels}. Used to catagorize {@link BaseObject._fillVoxels} by the largest axes of the group.
 */
export interface SortFillVoxelsOutput {
   /**
  * A {@link JointBoundingBox} that combines each entry from {@link BaseObject.sortedFillVoxelsDirectory} into one box.
  * 
  * @remarks
  * Returned from {@link BaseObject.sortFillVoxels}
  */
   jointBoundingBox: JointBoundingBox
   /**
    * Catagorizes a group of voxels into a directory where the key is the value of the largest axes from the {@link BoundingBox}. The value is all voxels with that coordinate value.
    * 
    * @remarks
    * Returned from {@link BaseObject.sortFillVoxels}
   */
   sortedFillVoxelsDirectory: SortedFillVoxelsDirectoryType
}

/**
 * Catagorizes a group of voxels into a directory where the key is the value of the largest axes from the {@link BoundingBox}. The value is all voxels with that coordinate value.
 */
export type SortedFillVoxelsDirectoryType = Record<number, Voxel[]>

/**
 * A BaseObject holds the most basic data structures required to construct a 3D tesselated shape.
 * 
 * @todo Add sorting methods
 * 
 * @remarks
 * See the instance attributes for the baseline requirements to be considered a shape.
 */
export class BaseObject {
   controller: UUIDController
   /**
    * UUID sourced by an {@link UUIDController} instance. The UUID is used by <Insert future composite class here> for caching composite operations.
    */
   uuid: string
   /**
    * Array of {@link Voxel} that represent all of the voxels that make up this shape. 
    * 
    * @remarks
    * 1) This directory is not internally private because it may be millions of voxels in length and a programmer may want to access the array without creating a copy.
    * 2) Voxels stored within this array do not account for the origin. {@link BaseObject.getFillVoxels} will return a mutation free copy of the fill voxels with origin accounted for.
    * 3) Default is [[0,0,0]] for constructor. All other inital instance attributes are based around this.
    * 4) Everytime the shapes fill voxels or origin are changed, {@link BaseObject.calculateBoundingBox} must be called. This is automatically done by default sub classes such as {@link Line}.
    */
   _fillVoxels: Voxel[]
   /**
    * A XYZ offset of the shape. 
    * 
    * @remarks
    * This allows the shape to be moved around without recalculating all of the {@link BaseObject._fillVoxels}.
    */
   _origin: Voxel
   /**
    * A {@link JointBoundingBox} that combines each entry from {@link BaseObject.sortedFillVoxelsDirectory} into one box.
    * 
    * @remarks
    * Returned from {@link BaseObject.sortFillVoxels}, Accounts for origin.
    */
   jointBoundingBox: JointBoundingBox
   /**
    * A single {@link BoundingBox} that emcompasses the entire {@link BaseObject._fillVoxels}.
    * 
    * If the their are no voxels to surrond, it comes a empty Bounding Box {@link ZeroVolumeBoundingBox}. This type mimics a bounding box, but contains no corner voxels or range data.
    * 
    * Without these zero voxel type, the {@link BaseObject} could never represent a shape with no Voxels, 
    * which would be a would be a issue with representing a shape the is composed as the mathematical intersection between two shapes that do not intersect.
    * 
    * @remarks
    * Accounts for origin.
    */
   boundingBox: ZeroVolumeBoundingBox | BoundingBox
   /**
    * Catagorizes a group of voxels into a directory where the key is the value of the largest axes from the {@link BoundingBox}. The value is all voxels with that coordinate value.
    *     
    * @remarks
    * Returned from {@link BaseObject.sortFillVoxels}, Accounts for origin.
   */
   sortedFillVoxelsDirectory: SortedFillVoxelsDirectoryType
   constructor(options: BaseObjectOptions) {
      this.controller = options.controller
      this.uuid = options.controller.getNewID()
      // Inital value
      this._fillVoxels = [[0, 0, 0]]
      this._origin = [...options.origin]
      this.boundingBox = new BoundingBox({
         boundingInputPayload: BaseObject.addOrigin(this._fillVoxels, this._origin),
         inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS
      });
      let output: SortFillVoxelsOutput = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox as BoundingBox)
      this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory
      this.jointBoundingBox = output.jointBoundingBox
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
   static addOrigin(arr: Voxel[], o: Voxel): Voxel[] {
      return arr.reduce<Voxel[]>((prev, curr) => {
         return prev.push([curr[0] + o[0], curr[1] + o[1], curr[2] + o[2]]), prev;
      }, [])
   }
   /**
    * Getter method.
    * 
    * @returns Mutation free copy of the shape origin.
    */
   getOrigin(): Voxel {
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
   getFillVoxels() {
      return BaseObject.addOrigin(this._fillVoxels, this.getOrigin());
   }
   /**
    * Since the {@link BaseObject.boundingBox}, {@link BaseObject.sortedFillVoxelsDirectory}, and {@link BaseObject.jointBoundingBox} are all based on the current {@link BaseObject._fillVoxels}, a change to the fill voxels or origin will now make these directories wrong.
    * 
    * Each time the fill voxels or origin are changed, this method must be called. Any built in subclass of {@link BaseObject} that changes fill voxels, such as {@link Line.generateLine}, will automatically call this method.
    *
    * {@link BaseObject.sortFillVoxels} can only accept a BoundingBox and more than one Voxel. As a result, we cannot run that function when the object has no voxels. 
    * 
    * As a result, running this function when you have no voxels will result in creating a {@link ZeroVolumeBoundingBox}, an empty {@link JointBoundingBox}, and an empty {@link BaseObject.sortedFillVoxelsDirectory}
   */
   calculateBoundingBox(): void {
      if (this._fillVoxels.length === 0) {
         this.boundingBox = { boundingBox: BoundingBox.getEmptyBoundingTemplate() } as ZeroVolumeBoundingBox
         this.jointBoundingBox = new JointBoundingBox([])
         this.sortedFillVoxelsDirectory = {}
      } else {
         this.boundingBox = new BoundingBox({
            inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
            boundingInputPayload: this.getFillVoxels()
         });
         let output: SortFillVoxelsOutput = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox as BoundingBox)
         this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory
         this.jointBoundingBox = output.jointBoundingBox
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
   setOrigin(o: Voxel): void {
      this._origin = [...o]
      this.calculateBoundingBox()
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
   static sortFillVoxels(inputVoxels: Voxel[], InputBoundingObject: BoundingBox): SortFillVoxelsOutput {
      let sortedFillVoxelsDirectory: SortedFillVoxelsDirectoryType = {}
      let sliceBoundingBoxDirectory: BoundingBox[] = [];
      if (inputVoxels.length === 0) {
         return {
            jointBoundingBox: new JointBoundingBox([]),
            sortedFillVoxelsDirectory
         };
      }
      const { biggestRangeIndex, biggestRangeLabaledHigh, biggestRangeLabaledLow } = InputBoundingObject
      for (let i = InputBoundingObject[biggestRangeLabaledLow[0] as ("xLow" | "zLow" | "yLow")]; i <= InputBoundingObject[biggestRangeLabaledHigh[0] as ("xHigh" | "yHigh" | "zHigh")]; i++) {
         sortedFillVoxelsDirectory[i] = []
      }
      for (let i = 0; i < inputVoxels.length; i++) {
         let voxel = inputVoxels[i];
         sortedFillVoxelsDirectory[voxel[biggestRangeIndex[0]]].push([...voxel])
      }
      for (let key of Object.keys(sortedFillVoxelsDirectory)) {
         let fillKey = Number(key)
         if (sortedFillVoxelsDirectory[fillKey].length >= 1) {
            sliceBoundingBoxDirectory.push(new BoundingBox({
               inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
               boundingInputPayload: sortedFillVoxelsDirectory[fillKey]
            })
            )
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
   static graph3DParametric = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Voxel[] => {
      let dy = y2 - y1
      let dx = x2 - x1
      let dz = z2 - z1
      let qChange: qChangeInterface = {
         x: dx < 0 ? -1 : 1,
         y: dy < 0 ? -1 : 1,
         z: dz < 0 ? -1 : 1
      }
      type qChangeKey = keyof qChangeInterface;
      if (dx < 1 && dx > -1) {
         qChange.x = 0
      }
      if (dy < 1 && dy > -1) {
         qChange.y = 0
      }
      if (dz < 1 && dz > -1) {
         qChange.z = 0
      }
      dx = Math.abs(dx)
      dy = Math.abs(dy)
      dz = Math.abs(dz)
      let largestChange;
      if (dy >= dz && dy >= dx) {
         largestChange = "y"
      } else if (dx >= dy && dx >= dz) {
         largestChange = "x"
      } else {
         largestChange = "z"
      }
      if (qChange[largestChange as qChangeKey] === 0) {
         return [[x2, y2, z2]]
      }
      let largestTarget = Math.max(dy, dx, dz)
      let startAxis = largestChange === "y" ? y1 : largestChange === "x" ? x1 : z1
      let x = x1
      let y = y1;
      let z = z1
      let points: Voxel[] = []
      let rx = 0;
      let ry = 0;
      let rz = 0;
      for (let i = startAxis; qChange[largestChange as qChangeKey] === 1 ? i <= startAxis + largestTarget : i >= startAxis - largestTarget; i += qChange[largestChange as qChangeKey]) {
         if (largestChange === "x") {
            if (ry >= dx) {
               ry -= dx
               y += qChange["y"]
            }
            if (rz >= dx) {
               rz -= dx
               z += qChange["z"]
            }
            ry += dy
            rz += dz
            points.push([i, y, z])
            continue;
         }
         if (largestChange === "y") {
            if (rx >= dy) {
               rx -= dy
               x += qChange["x"]
            }
            if (rz >= dy) {
               rz -= dy
               z += qChange["z"]
            }
            rx += dx
            rz += dz
            points.push([x, i, z])
            continue;
         }
         if (largestChange === "z") {
            if (rx >= dz) {
               rx -= dz
               x += qChange["x"]
            }
            if (ry >= dz) {
               ry -= dz
               y += qChange["y"]
            }
            ry += dy
            rx += dx
            points.push([x, y, i])
            continue;
         }
      }
      return points;
   }
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
   static compare2d(a1: any[], a2: any[]): boolean {
      if (a1.length !== a2.length) {
         return false
      }
      if (Array.isArray(a1) && Array.isArray(a2)) {
         for (let i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i]) {
               return false;
            }
         }
         return true;
      } else {
         console.warn('compare2d | One or more of the inputs is not an array |' + new Date)
         return false
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
   static push2D(from: any[], to: any[]): any[] {
      for (let n of from) {
         to.push([...n])
      }
      return to
   }
   static deepCopy(object: any): any {
      return JSON.parse(JSON.stringify(object))
   }
}

/**
 * The valid {@link Line} options. 
 */
export interface LineOptions {
   "controller": UUIDController,
   "origin": Voxel,
   /**
    * The [start, end] points of the line.
    */
   "endPoints": [Voxel, Voxel]
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
   _endPoints: Voxel[]
   constructor(options: LineOptions) {
      super({
         controller: options.controller,
         origin: options.origin,
      })
      this.controller.setReferenceEntry(this.uuid, this)
      this._endPoints = BaseObject.deepCopy(options.endPoints)
      this._fillVoxels = [...this._endPoints]
      this.calculateBoundingBox()
   }
   /**
    * Generates the line between the {@link Line._endPoints}.
    * The outputted {@link Line._fillVoxels} are sorted by the first, second, and then third smallest axes order.
    */
   generateLine() {
      const { biggestRangeIndex } = this.boundingBox as BoundingBox;
      let startToEnd = BaseObject.graph3DParametric(
         ...this._endPoints[0],
         ...this._endPoints[1]
      );
      BaseObject.push2D(startToEnd, this._fillVoxels);
      this._fillVoxels = this._fillVoxels
         .sort((a, b) => a[biggestRangeIndex[0]] - b[biggestRangeIndex[0]])
         .sort((a, b) => a[biggestRangeIndex[1]] - b[biggestRangeIndex[1]])
         .sort((a, b) => a[biggestRangeIndex[2]] - b[biggestRangeIndex[2]])
      this.calculateBoundingBox()
   }
   /**
    * @returns The {@link Line._endPoints} with each {@link Line._origin} added to them via {@link BaseObject.addOrigin}.
    */
   getVerticeVoxels(): Voxel[] {
      return BaseObject.addOrigin(this._endPoints, this._origin);
   }
   /**
    * Changes the current {@link Line._endPoints}, set them as the {@link Line._fillVoxels}, calculautes required bounding box data.
    * @param endPoints New End Points [start, end] 
    */
   changeEndPoints(endPoints: [Voxel, Voxel]) { // done
      this._endPoints = [endPoints[0], endPoints[1]]
      this._fillVoxels = [...this._endPoints]
      this.calculateBoundingBox()
   }
}

/**
 * Options for the {@link Layer} constructor.
 */
export interface LayerOptions {
   "controller": UUIDController,
   "origin": Voxel,
   "verticesArray": Voxel[]
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
   _verticesArray: Voxel[]
   /**
    * Stores the voxels on the edge of the polygon. 
    * 
    * The key is the vertice number in start to end format. For example, "V0V1" represents vertice index zero to index one from {@link _verticesArray}
    */
   edgeDirectory: Record<string, Voxel[]>
   constructor(options: LayerOptions) {
      super({
         controller: options.controller,
         origin: options.origin
      })
      this.controller.setReferenceEntry(this.uuid, this)
      this._verticesArray = BaseObject.deepCopy(options.verticesArray)
      this._fillVoxels = [...this._verticesArray]
      this.calculateBoundingBox()
      this.edgeDirectory = {}
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
   changeVertices(verticesArray: Voxel[]): Layer { // done
      this._verticesArray = BaseObject.deepCopy(verticesArray)
      this._fillVoxels = [...this._verticesArray]
      this.calculateBoundingBox()
      this.edgeDirectory = {}
      return this
   }
   /**
    * Generates the entries of {@link Layer.edgeDirectory}, where each entry is a line that connects one vertice to another.
    * 
    * Use {@link Layer.getEdgeVoxels} to acess all edge voxels as a single array.
    * 
    * Also adds all voxels from the edge directory to the {@link Layer._fillVoxels}.
    * 
    * @returns reference to layer object, allows for method chaining.
    */
   generateEdges(): Layer {
      this._fillVoxels = []
      let tempLine = new Line({
         endPoints: [[0, 0, 0], [0, 0, 0]],
         controller: this.controller,
         origin: this.getOrigin()
      })
      this.edgeDirectory = {}
      // If this shape has more then 1 vertice
      if (this._verticesArray.length > 1) {
         // Loop through all the vertices
         for (let i = 0; i < this._verticesArray.length; i++) {
            // If we are at the last vertices in the list, draw back to the first one.
            let startIndex = i;
            let endIndex;
            if (i + 1 === this._verticesArray.length) {
               endIndex = 0;
            } else {
               endIndex = i + 1;
            }
            let entryKey = `V${startIndex}V${endIndex}`
            /* 
               Since we are using a rasterization,
               drawing a line from two given points will results in different values
               depending on if you go from start to end or end to start order
               A double sided line is used.
            */
            tempLine.changeEndPoints([this._verticesArray[startIndex], this._verticesArray[endIndex]]);
            tempLine.generateLine()
            let lineFillVoxels = tempLine.getFillVoxels();
            this.edgeDirectory[entryKey] = lineFillVoxels;
            BaseObject.push2D(this.edgeDirectory[entryKey].slice(1, lineFillVoxels.length - 1), this._fillVoxels)
         }
      } else {
         this.edgeDirectory["V0V0"] = [[...this._verticesArray[0]]];
         this._fillVoxels.push([...this._verticesArray[0]])
      }
      BaseObject.push2D(this._verticesArray, this._fillVoxels)
      tempLine.controller.removeReferenceEntry(this.uuid)
      tempLine.controller.removeID(this.uuid)
      this.calculateBoundingBox();
      return this
   }
   /**
    * Uses the {@link Layer.sortedFillVoxelsDirectory} generated from the {@link Layer._fillVoxels} generated from {@link Layer.generateEdges} to fill in the shape.
    * 
    * Sets {@link Layer._fillVoxels} and calculautes bounding box.
    * 
    * @returns reference to layer object, allows for method chaining.
    */
   fillPolygon(): Layer {
      this._fillVoxels = []
      let temporary2DSlice = new Layer({
         verticesArray: [],
         origin: this.getOrigin(),
         controller: this.controller
      })
      for (let entry of Object.keys(this.sortedFillVoxelsDirectory)) {
         let currentEntry = Number(entry)
         let entryVoxels = this.sortedFillVoxelsDirectory[currentEntry as keyof SortedFillVoxelsDirectoryType];
         temporary2DSlice.changeVertices(entryVoxels).generateEdges();
         BaseObject.push2D(temporary2DSlice.getFillVoxels(), this._fillVoxels)
      }
      temporary2DSlice.controller.removeID(temporary2DSlice.uuid)
      this.calculateBoundingBox();
      return this
   }
   /**
    * Compiles the {@link Layer.edgeDirectory} into a single 2D array
    * @returns Array of all voxels that make up the shape.
    */
   getEdgeVoxels(): Voxel[] {
      let output: Voxel[] = [];
      for (const [edge, array] of Object.entries(this.edgeDirectory)) {
         for (let [index, voxel] of Object.entries(this.edgeDirectory[edge])) {
            output.push([voxel[0] + this._origin[0], voxel[1] + this._origin[1], voxel[2] + this._origin[2]])
         }
      }
      return output;
   }
   /**
    * @returns the {@link Layer._verticesArray}, accounts for origin and is mutation free.
    */
   getVerticeVoxels(): Voxel[] {
      return BaseObject.addOrigin(this._verticesArray, this._origin);
   }
}

interface GroupRankingValue {
   "i": [number, number],
   "n": boolean
}

interface GroupRanking {
   [key: string]: GroupRankingValue
}

/**
 * @remarks 
 * This type assertion is used for checking if a given string is a valid key of {@link SYNTAX_REGEX} 
 */
type REGEX_NAME_KEYS = keyof typeof SYNTAX_REGEX;
/**
 * @remarks 
 * This type assertion is used for checking if a given string is a valid key of {@link OPS} 
 */
type OPS_TOKEN = keyof typeof OPS;
/**
 * @remarks
 * This recursive type is used for the abstract syntax tree of various levels of embedded strings arrays. 
 * The deeper the level of a string array is equal to the order of presedence the operation should be interpeted by:
 * 
 * [["A","+","B"],"*","C"] is equal to (A+B)*C
 * 
 * This AST should be exeucuted by doing A+B first and then multiply by C. 
 */
type AST = (string | AST)[];

/**
 * @remarks
 * Contains all of the syntax tokens used by the {@link SetOperationsParser}.
 */
const SYNTAX_TOKENS = {
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
} as const

/**
 * @remarks
 * Holds the valid modes as accepted by the {@link SetOperationsParser.useRegex}
 */
export enum SetOperationsParserAction {
   /**
    * @remarks
    * This mode signifies to use the {@link RegExp.test} method upon the given string. 
    */
   TEST_MODE = 'TEST_MODE',
   /**
    * @remarks
    * This mode signifies to use the {@link String.match} method upon the given string. 
    */
   MATCH_MODE = 'MATCH_MODE',
}

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
} as const
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
} as const
/**
 * A final all static parser to convert discrete math equations into valid abstract syntax trees {@link AST}.
 */
export class SetOperationsParser {
   /**
    * @remarks
    * Private constructor to support final class functionality
    */
   private constructor() { }
   /**
    * @remarks
    * Retrives a mutation-free copy of the {@link SYNTAX_REGEX}
    * @returns A dictionary where the key string is the name of the regex value.
    */
   static getAllRegex(): Record<string, RegExp> {
      return Object.keys(SYNTAX_REGEX).reduce<Record<string, RegExp>>((prev, key) => {
         return prev[key] = new RegExp(SYNTAX_REGEX[key as REGEX_NAME_KEYS].source, "gi"), prev;
      }, {});
   }
   /**
    * @remarks
    * Retrieves the order of operations presidence of a given token in reference to other valid tokens
    * @param token A valid key within {@link OPS}.
    * @returns The value inclusively between 3 and 0 of the tokens order of operations.
    */
   static accessOPS(token: keyof typeof OPS): 3 | 2 | 1 | 0 {
      return OPS[token];
   }
   /**
    * @remarks
    * Retrieves a mutation-free copy of the {@link OPS}
    * @returns A dictionary where the key string is the token, and the value is the presdience.
    */
   static getOPS(): Record<string, number> {
      return Object.assign({}, OPS);
   }
   /**
    * @remarks
    * The valid tokens for the {@link SetOperationsParser} as defined by {@link SYNTAX_TOKENS}
    * @returns A dictionary where the key string is the name of the token, and the value is the token string.
    */
   static getSymbols(): Record<string, string> {
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
      }
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
   static useRegex(name: REGEX_NAME_KEYS, str: string, action: keyof typeof SetOperationsParserAction) {
      let regex: RegExp = new RegExp(SYNTAX_REGEX[`${name}`].source, "gi");
      let matchResult: string[] | null;
      let boolResult = false;
      if (action === SetOperationsParserAction.TEST_MODE) {
         boolResult = regex.test(str);
         regex.lastIndex = 0;
         return boolResult;
      } else if (action === SetOperationsParserAction.MATCH_MODE) {
         matchResult = str.match(regex);
         regex.lastIndex = 0;
         return matchResult === null ? [] : matchResult
      } else {
         throw new TypeError("Invalid Action: " + action)
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
   static validateEquation(str: string): string[] {
      // Filter whitespace
      str = str.split("").filter(x => !/\s/.test(x)).join("")

      /**
       * @remarks
       * Used to store tokens, both for comparison and error throwing, throughout the validation process.
       */
      let errorTokens: string[] | boolean;

      // Invalid characters are those not a-zA-Z and are not static symbols
      for (let i = 0; i < str.length; i++) {
         errorTokens = SetOperationsParser.useRegex("VALID_CHAR_REGEX", str[i], SetOperationsParserAction.TEST_MODE);
         if (!errorTokens) {
            throw new TypeError(`VALID_CHAR_REGEX | Unable to validate equationString "${str}": Invalid token ${str[i]}`)
         }
      }

      errorTokens = SetOperationsParser.useRegex("INVALID_NEGATION_CLOSE_PER_REGEX", str, SetOperationsParserAction.TEST_MODE);

      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_NEGATION_CLOSE_PER_REGEX | Unable to validate equationString "${str}": Cannot pre negate "${SYNTAX_TOKENS.NEGATION_OP}" closing grouping syntax "${SYNTAX_TOKENS.CLOSE_PER}" with tokens "${errorTokens[0]}" `)
      }



      let cper = SetOperationsParser.useRegex("CLOSE_PER_COUNT_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      let oper = SetOperationsParser.useRegex("OPEN_PER_COUNT_REGEX", str, SetOperationsParserAction.MATCH_MODE);
      if (oper instanceof Array && cper instanceof Array && cper.length !== oper.length) {
         throw new TypeError(`CLOSE_PER_COUNT_REGEX, OPEN_PER_COUNT_REGEX | Unable to validate equationString "${str}": unequal amount of starting and ending grouping syntax`)
      }

      errorTokens = SetOperationsParser.useRegex("INVALID_ENDING_REGEX", str, SetOperationsParserAction.MATCH_MODE)

      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_ENDING_REGEX | Unable to validate equationString "${str}": Ends with operator, negation or opening grouping syntax token: "${errorTokens}"`);
      }


      errorTokens = SetOperationsParser.useRegex("INVALID_OP_DIRECT_NEGATE_REGEX", str, SetOperationsParserAction.MATCH_MODE)

      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_OP_DIRECT_NEGATE_REGEX | Unable to validate equationString "${str}": Cannot directly negate symmetric difference or subtraction operator "${errorTokens}"`)
      }

      errorTokens = SetOperationsParser.useRegex("INVALID_JUNCTION_REGEX", str, SetOperationsParserAction.MATCH_MODE)

      if (errorTokens instanceof Array && errorTokens.length > 0) {
         throw new TypeError(`INVALID_JUNCTION_REGEX | Unable to validate equationString "${str}": Invalid Junction between two tokens "${errorTokens}"`)
      }
      /* 
        Replace negation operations, Optimization
      */
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.NEGATION_OP}`, "")
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.INTERSECTION_OP}`, `${SYNTAX_TOKENS.UNION_OP}`)
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.UNION_OP}`, `${SYNTAX_TOKENS.INTERSECTION_OP}`)
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.UNIVERSAL_SET}`, `${SYNTAX_TOKENS.NULL_SET}`)
      str = str.replaceAll(`${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.NULL_SET}`, `${SYNTAX_TOKENS.UNIVERSAL_SET}`)
      // Remove the grouping if they are the first and last elements in the string
      if (oper instanceof Array && cper instanceof Array && cper.length === 1 && oper.length === 1 && str[0] === SYNTAX_TOKENS.OPEN_PER && str[str.length - 1] === SYNTAX_TOKENS.CLOSE_PER) {
         str = str.replace(`${SYNTAX_TOKENS.OPEN_PER}`, "").replace(`${SYNTAX_TOKENS.CLOSE_PER}`, "");
      }
      return SetOperationsParser.useRegex("CONVERSION_REGEX", str, SetOperationsParserAction.MATCH_MODE) as string[];
   }
   /**
    * @remarks
    * Distributes the negation operation to a AST, recursively goes down all levels of the AST. Any branches that start with "NOT" as the first token in the expression will not be distrubuted to.
    * @param eq The AST
    * @param log boolean to siginify if the program should log the process to the console.
    * @param depth Level of depth for this current recursive call. Can be any number 0 and above.
    * @returns The negated AST.
    */
   static _distrubuteNegate(eq: AST, log: boolean, depth: number): AST {
      let str = "";
      for (let i = 0; i < depth; i++) {
         str += SYNTAX_TOKENS.IDENTATION;
      }
      if (log) {
         console.log(str + "Distrubting negation to: " + JSON.stringify(eq))
      }
      for (let i = 0; i < eq.length; i++) {
         if (eq[i] === SYNTAX_TOKENS.SYMM_DIFF_OP) {
            throw new TypeError("Processing error: can not directly negate SYMM_DIFF_OP: " + eq[i])
         }
         if (Array.isArray(eq[i]) && eq[i] as AST) {
            if (log) {
               console.log(str + " Activiated distribution to sub-AST")
            }
            eq[i] = SetOperationsParser._distrubuteNegate(eq[i] as AST, log, depth)
         } else if (eq[i] === SYNTAX_TOKENS.UNION_OP) {
            eq[i] = SYNTAX_TOKENS.INTERSECTION_OP
         } else if (eq[i] === SYNTAX_TOKENS.INTERSECTION_OP) {
            eq[i] = SYNTAX_TOKENS.UNION_OP
         } else if (eq[i] === SYNTAX_TOKENS.NEGATION_OP) {
            eq[i] = ""
         } else if (typeof eq[i] === 'string' && (eq[i] as string).split("")[0] === SYNTAX_TOKENS.NEGATION_OP) {
            eq[i] = eq[i].slice(1, eq[i].length)
         } else if (eq[i] === SYNTAX_TOKENS.SUBTRACTION_OP) {
            if (log) {
               console.log(str + "Subtraction negation detected, switching to union and halting")
            }
            // Cuts off last operation to satifsy !(a-b) = !a U b;
            eq[i] = SYNTAX_TOKENS.UNION_OP;
            return eq;
         } else if (eq[i] === SYNTAX_TOKENS.UNIVERSAL_SET) {
            eq[i] = SYNTAX_TOKENS.NULL_SET;
         } else if (eq[i] === SYNTAX_TOKENS.NULL_SET) {
            eq[i] = SYNTAX_TOKENS.UNIVERSAL_SET;
         } else {
            eq[i] = [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, eq[i]]
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
   static generateAST(eq: AST, log: boolean, depth = 0): AST | string {
      let string = ""
      if (log) {
         for (let i = 0; i <= depth; i++) {
            string += SYNTAX_TOKENS.IDENTATION
         }
         console.log(string + "Input EQ: " + JSON.stringify(eq));
         console.log(string + "Length of EQ: " + (eq.length))
         depth += 1
      }
      /**
   * @remarks
   * The index of the variable on the left side of the operation.
   */
      let startIndex: number = -1;
      /**
       * @remarks
       * The index of the variable on the right side of the operation.
       */
      let endIndex: number = -1;
      /**
      * @remarks
      * The index of the operation.
      */
      let opIndex: number = -1;
      /**
       * @remarks
       * The value of this operation as stored in {@link OPS} accessiable via {@link SetOperationsParser.accessOPS}
       */
      let indexValue: number = -1;
      /**
       * @remarks
       * Stores the indicies of all of the opening grouping tokens, used to decide {@link perStartIndex}.
       */
      let startPerArray: number[] = [];
      /**
       * @remarks
       * Stores the indicies of all of the closing grouping tokens, used to decide {@link perEndIndex}.
       */
      let endPerArray: number[] = [];
      /**
       * @remarks
       * Stores the indicies of all of the negated opening grouping tokens, has overlap with {@link startPerArray}.
       */
      let negatedPerArray: number[] = [];
      /** 
       * @remarks
       * Stores the indicies of all of the symmertic difference operations. This is important, because if a SD is within a negated
       * grouping, special conversion processes need to take place before {@link SetOperationsParser._distrubuteNegate} 
       * is called upon that section of the AST.
       */
      let symmPerArray: number[] = [];

      if (eq.length <= 2) {
         if (log) {
            console.log(string + "Equation length is <= 2, returning equation")
         }
         return [...eq]
      }

      // The first step is to gather metadata about the AST.

      for (let i = 0; i < eq.length; i++) {
         let token = eq[i]
         if (log) {
            console.log(string + "Checking Token: " + JSON.stringify(token))
         }
         // Remove double or more negation

         if (!Array.isArray(token) && token.startsWith("!!")) {
            if (log) {
               console.log(string + "Token starts with n >= 2 negation: " + token)
            }
            // If the negation amount is odd, make it a single negation. Otherwise, no negation.
            let testToken = token.split("");
            token = (testToken.slice(0, testToken.length - 1).length % 2 === 0 ? "" : SYNTAX_TOKENS.NEGATION_OP) + testToken[testToken.length - 1];
            if (log) {
               console.log(string + "Converted Token starts with n >= 2 negation: " + token)
            }
            eq[i] = token;
         }

         if (token === SYNTAX_TOKENS.SYMM_DIFF_OP) {
            symmPerArray.push(i);
         }

         // Gather negated grouping information.
         if (!Array.isArray(token) && token.startsWith(SYNTAX_TOKENS.NEGATION_OP)) {
            if (log) {
               console.log(string + "Token starts with negation")
            }
            token = token.split("")
            if (token[1] === SYNTAX_TOKENS.OPEN_PER) {
               if (log) {
                  console.log(string + "Token is negating open Grouping")
               }
               negatedPerArray.push(i)
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
            token = token[1] as OPS_TOKEN;
            if (!OPS.hasOwnProperty(token)) {
               eq[i] = [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, token]
               if (log) {
                  console.log(string + "Activated Token is negating set: " + JSON.stringify(eq[i]))
               }
            }
         }
         if (token === SYNTAX_TOKENS.OPEN_PER) {
            startPerArray.push(i)
         }
         else if (token == SYNTAX_TOKENS.CLOSE_PER) {
            endPerArray.push(i)
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
         else if (OPS.hasOwnProperty(token as OPS_TOKEN)
            && (indexValue === undefined || OPS[token as OPS_TOKEN] > indexValue)
            && !(token === SYNTAX_TOKENS.SYMM_DIFF_OP && eq[i + 1] === `${SYNTAX_TOKENS.NEGATION_OP}${SYNTAX_TOKENS.OPEN_PER}`)) {
            if (log) {
               console.log(string + "Activated operation identification loop condition")
            }
            indexValue = OPS[token as OPS_TOKEN];
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
               return depth === 1 ? [eq[0]] : eq[0]
            }
            if (eq[1] === SYNTAX_TOKENS.SYMM_DIFF_OP || eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP) {
               if (log) {
                  console.log(string + "Activated L3 Symmertic Difference or subtraction with itself returning null");
               }
               return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET
            }
         }
         // If the left or right side of the equation is a null set
         if (eq[0] === SYNTAX_TOKENS.NULL_SET || eq[2] === SYNTAX_TOKENS.NULL_SET) {
            // Intersection them returns a null set
            if (eq[1] === SYNTAX_TOKENS.INTERSECTION_OP) {
               if (log) {
                  console.log(string + "L3: Activated intersection null");
               }
               return SYNTAX_TOKENS.NULL_SET
            } else if (eq[1] === SYNTAX_TOKENS.UNION_OP || eq[1] === SYNTAX_TOKENS.SYMM_DIFF_OP) {
               if (log) {
                  console.log(string + "L3: Activated union null");
               }
               return eq[0] === SYNTAX_TOKENS.NULL_SET ? depth === 1 ? [eq[2]] : eq[2] : depth === 1 ? [eq[0]] : eq[0]
            } else if (eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP) {
               if (log) {
                  console.log(string + "L3: Activiated set subtraction with null set");
               }
               /* In SQL, null minus null yeilds null so I apply this logic */
               // null - set
               if (eq[0] === SYNTAX_TOKENS.NULL_SET) {
                  return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET;
               } else {
                  // set - null
                  return depth === 1 ? [eq[0]] : eq[0];
               }
            }
         }
         // a set minus the universal leaves nothing left over.
         if (eq[1] === SYNTAX_TOKENS.SUBTRACTION_OP && eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET) {
            if (log) {
               console.log(string + "L3: Activated minus universal set equals null")
            }
            return depth === 1 ? [SYNTAX_TOKENS.NULL_SET] : SYNTAX_TOKENS.NULL_SET;
         }
         // union to a universal set
         if ((eq[1] === SYNTAX_TOKENS.UNION_OP) && (eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET || eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET)) {
            if (log) {
               console.log(string + "L3: Activated union universal set equals universal")
            }
            return depth === 1 ? [SYNTAX_TOKENS.UNIVERSAL_SET] : SYNTAX_TOKENS.UNIVERSAL_SET
         }

         // intersection to a universal set

         if ((eq[1] === SYNTAX_TOKENS.INTERSECTION_OP) && (eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET || eq[2] === SYNTAX_TOKENS.UNIVERSAL_SET)) {
            if (log) {
               console.log(string + "L3: Activated intersection universal set")
            }
            return eq[0] === SYNTAX_TOKENS.UNIVERSAL_SET ? depth === 1 ? [eq[2]] : eq[2] : depth === 1 ? [eq[0]] : eq[0]
         }
         if (log) {
            console.log(string + "L3: Returning eq")
         }
         return [...eq];
      }
      if (symmPerArray.length > 0) {
         if (log) {
            console.log(string + "Amount of Symmertries: " + symmPerArray.length)
         }
      }
      /// This should be detected if the equation is validated, but parser errors can happen.
      if (startPerArray.length !== endPerArray.length) {
         console.log(eq, startPerArray, endPerArray)
         throw new Error("Invalid Amount of Grouping");
      }

      // From here, figure out the most embedded group of parenthesis.
      let groupRanking: GroupRanking = {}
      let groupCounter = 0;
      // If their is closing or opening grouping.
      let allPerArray = [...startPerArray, ...endPerArray]
      while (allPerArray.length > 0) {
         let perStartIndex: number = -1;
         let perEndIndex: number = -1;
         allPerArray = [...startPerArray, ...endPerArray]
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
               }
               startPerArray = startPerArray.filter((v, i) => i !== startPerArray.indexOf(perStartIndex))
               endPerArray = endPerArray.filter((v, i) => i !== endPerArray.indexOf(perEndIndex))
               break startLoop;
            }
         }
      }

      let targetOpeningPer: number = -1;
      let targetClosingPer: number = -1;
      let negatedOpeningPer: number = -1;
      let negatedClosingPer: number = -1;
      let groupRankingKeys: string[] = Object.keys(groupRanking);
      if (groupRankingKeys.length > 0) {
         targetOpeningPer = groupRanking["1"]["i"][0];
         targetClosingPer = groupRanking["1"]["i"][1];
         let closetRanking: number = -1
         for (let key of groupRankingKeys) {
            // Find the negating grouping that is the closet depth to our current opening and closing.
            if (groupRanking[key as keyof typeof groupRanking]["n"] &&
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
         console.log(string + "Grouping Ranking" + JSON.stringify(groupRanking))
         console.log(string + "Target Opening Grouping Index " + targetOpeningPer)
         console.log(string + "Target Closing Grouping Index " + targetClosingPer)
         console.log(string + "Target Negated Opening Grouping Index " + negatedOpeningPer)
         console.log(string + "Target Negated Opening Grouping Index " + negatedClosingPer)
      }
      // If their is grouping that is being negated, their may be symmertic differences within that parenthesis that are being negated.

      // If we have a negation somewhere in the array.
      if (negatedClosingPer !== -1 && negatedOpeningPer != -1) {
         if (log) {
            console.log(string + "Activiated Symmertric Difference negation check")
         }
         // Check if a symmertic difference is between it at any level.
         for (let i = 0; i < symmPerArray.length; i++) {
            // If this symmsertic difference is between the negation grouping
            if (symmPerArray[i] > negatedOpeningPer && symmPerArray[i] < negatedClosingPer) {
               if (log) {
                  console.log(string + `Symmertic difference at index ${symmPerArray[i]} is being negated.`)
               }
               eq[negatedOpeningPer] = `${SYNTAX_TOKENS.OPEN_PER}`
               return SetOperationsParser.generateAST([...eq.slice(0, negatedOpeningPer), [SYNTAX_TOKENS.UNIVERSAL_SET, SYNTAX_TOKENS.SUBTRACTION_OP, SetOperationsParser.generateAST([...eq.slice(negatedOpeningPer + 1, negatedClosingPer)], log, depth)], ...eq.slice(negatedClosingPer + 1, eq.length)], log, depth)
            }
         }
      }
      // Otherwise, if the start index for the most embedded grouping is also being negated "!(a+b)"
      else if (negatedClosingPer !== -1 && negatedOpeningPer != -1) {
         if (log) {
            console.log(string + "Activated Negated Grouping is startIndex")
         }
         // Previously, this operation on token did not mutate. Now we mutate the equation and remove the negative.
         eq[targetOpeningPer] = SYNTAX_TOKENS.OPEN_PER
         // Then, distrubute that grouping and all of the sub-groupings.
         eq = [...eq.slice(0, targetOpeningPer), ...this._distrubuteNegate(eq.slice(targetOpeningPer + 1, targetClosingPer), log, depth), ...eq.slice(targetClosingPer + 1, eq.length)]
         if (log) {
            console.log(string + "Combined and negated equation: " + JSON.stringify(eq))
         }
         // Otherwise, if this grouping is not being negated, then group all of the elements within that group into a new array
         // This gives presidence to that section of the AST.
      } else if (targetOpeningPer !== -1 && targetClosingPer !== -1) {
         if (log) {
            console.log(string + "Activated startPerArray Length Condition because their are " + startPerArray.length + " opening grouping syntax, target grouping syntax is at EQ startIndex: " + targetOpeningPer)
         }
         eq = [...eq.slice(0, targetOpeningPer), SetOperationsParser.generateAST(eq.slice(targetOpeningPer + 1, targetClosingPer), log, depth), ...eq.slice(targetClosingPer + 1, eq.length)];
      }
      // Otherwise, no grouping, just a pure A+B+C for example.
      else {
         if (log) {
            console.log(string + "Operation Index: " + opIndex)
         }
         // Turns ["A","+","B","+","C"] into [["A","+","B"],"+","C"]
         eq = [...eq.slice(0, startIndex), SetOperationsParser.generateAST([eq[startIndex], eq[opIndex], eq[endIndex]], log, depth), ...eq.slice(endIndex + 1, eq.length)];
      }
      // After all of this, put it back through the the parser again.
      // Need to use new varaible here because EQ is always an array, and since the collapse of the call may return a
      // string, we need to allow it to accept both because typescript.
      let newEq: string | AST = SetOperationsParser.generateAST(eq, log, depth)
      if (log) {
         console.log(string + "Equation is finalized, pushing to the tree")
      }
      console.log(string + JSON.stringify(newEq))
      // Then, pass this section of the AST back into the final AST. Collapse and return final result if at bottom of call stack.
      return newEq
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
   equationString: string;
   /**
    * If the {@link SetOperationsParser.generateAST} should produce a log to the console.
    */
   log: boolean;
   /**
    * The output of passing {@link SetOperationsEquation.equationString} through {@link SetOperationsParser.validateEquation}
    */
   validEquationArray: string[];
   /**
    * The output of passing {@link SetOperationsEquation.validEquationArray} through {@link SetOperationsParser.generateAST}.
    * This AST is stored as private to create a mutation-free storage. 
    */
   private equationAST: AST = [];
   /**
    * @remarks
    * Constructs a new {@link SetOperationsEquation}. 
    * @param str The string equation to create a new AST from
    * @param log Log production flag for {@link SetOperationsParser.generateAST}
    */
   constructor(str: string, log: boolean) {
      this.equationString = str;
      this.log = log;
      this.validEquationArray = [];
   }
   /**
    * @remarks
    * Accepts a new string as the {@link SetOperationsEquation.equationString}, resets all attributes accept {@link SetOperationsEquation.log} 
    * @param str New equation strng
    */
   changeEquation(str: string) {
      this.equationString = str;
      this.validEquationArray = [];
      this.equationAST = [];
   }
   /**
    * @remarks
    * To be called before {@link SetOperationsEquation.generateAST}.
    * Pass through functon to {@link SetOperationsParser.validateEquation} with {@link SetOperationsEquation.equationString} as the arguement.
    */
   validateEquation() {
      this.validEquationArray = SetOperationsParser.validateEquation(this.equationString);
   }
   /**
    * @remarks
    * To be called after {@link SetOperationsEquation.validateEquation}.
    * Pass through functon to {@link SetOperationsParser.generateAST} with arguments {@link SetOperationsEquation.validEquationArray}, 
    * {@link SetOperationsEquation.log}, and inital depth of zero.
    */
   generateAST() {
      this.equationAST = SetOperationsParser.generateAST([...this.validEquationArray], this.log, 0) as AST;
   }
   /**
    * @remarks
    * Returns stored AST
    * @returns Uses {@link JSON.parse} of {@link JSON.stringify} to return a deep copy of the AST.
    */
   getAST(): AST {
      return JSON.parse(JSON.stringify(this.equationAST));
   }
}

export interface CompositeOptions {
   "controller": UUIDController,
   "origin": Voxel
   "compositeObjects": BaseObject[]
   "log": boolean,
   "variableNames": Record<string, BaseObject>
}

export interface CollectionOptions {
   "controller": UUIDController,
   "origin": Voxel
   "fillVoxels": Voxel[]
}

/**
 * Acts as a median to {@link BaseObject} when the user may simply want to store voxels without them belonging to a particular shape.
 * 
 * Used by {@link CompositeVoxelGroup} to temporarily hold the intersection voxels between shapes 
 * 
 * Alows the user to pass in an array of voxels for storage
 */
class VoxelCollection extends BaseObject {
   constructor(options: CollectionOptions) {
      super({
         "controller": options.controller,
         "origin": options.origin
      })
      this._fillVoxels = []
      BaseObject.push2D(options.fillVoxels, this._fillVoxels)
      this.calculateBoundingBox()
   }
   setFillVoxels(newVoxels: Voxel[]): this {
      this._fillVoxels = []
      BaseObject.push2D(newVoxels, this._fillVoxels)
      this.calculateBoundingBox()
      return this
   }
   addFillVoxels(newVoxels: Voxel[]): this {
      BaseObject.push2D(newVoxels, this._fillVoxels)
      this.calculateBoundingBox()
      return this
   }
   // create shell around points
}

export type InterpeterAST = (string | BaseObject | InterpeterAST)[]
export type InterpeterToken = string | BaseObject

export class CompositeVoxelGroup extends BaseObject {
   equationInstance: SetOperationsEquation
   compositeObjects: BaseObject[]
   virtualCache: Record<string, BaseObject>
   tokens: Record<string, string>
   variableNames: Record<string, BaseObject>
   constructor(options: CompositeOptions) {
      super({
         "controller": options.controller,
         "origin": options.origin
      })
      this.equationInstance = new SetOperationsEquation("", options.log)
      this.compositeObjects = options.compositeObjects
      this._fillVoxels = []
      for (let i = 0; i < this.compositeObjects.length; i++) {
         BaseObject.push2D(this.compositeObjects[i].getFillVoxels(), this._fillVoxels)
      }
      this.calculateBoundingBox()
      this.tokens = SetOperationsParser.getSymbols();
      this.virtualCache = {
         [this.tokens.UNIVERSAL_SET]: new VoxelCollection({ controller: this.controller, fillVoxels: this.compositeObjects.reduce((accum, obj) => { return BaseObject.push2D(obj.getFillVoxels(), accum), accum }, []), origin: this._origin }),
         [this.tokens.NULL_SET]: new VoxelCollection({ controller: this.controller, fillVoxels: [], origin: this._origin })
      }
      this.variableNames = options.variableNames
   }
   changeCompositeObjects(compositeObjects: BaseObject[], variableNames: Record<string, BaseObject>): void {
      this.variableNames = variableNames
      this.compositeObjects = Object.assign({}, compositeObjects)
   }
   generateAST(equation: string): void {
      this.equationInstance.changeEquation(equation)
      this.equationInstance.validateEquation()
      this.equationInstance.generateAST()
   }
   #recursiveSolver(layer: InterpeterAST, depth: number): BaseObject {
      // need to deal with one length equations
      let token1: InterpeterToken = ""
      let operation: InterpeterToken = ""
      let token2: InterpeterToken = ""
      let str = "";
      for (let i = 0; i < depth; i++) {
         str += "-"
      }
      for (let i = 0; i < layer.length; i++) {
         if (Array.isArray(layer[i])) {
            layer[i] = this.#recursiveSolver(layer[i] as InterpeterAST, depth + 1);
         }
      }
      token1 = layer[0] as InterpeterToken
      if (layer.length !== 1) {
         operation = layer[1] as string
         token2 = layer[2] as InterpeterToken
      }
      // Default sets are not avaiable in the users memory address.
      try {
         if (typeof token1 === "string" && (token1 === this.tokens.UNIVERSAL_SET || token1 === this.tokens.NULL_SET)) {
            token1 = this.virtualCache[token1]
         } else if (typeof token1 === "string") {
            token1 = this.variableNames[token1]
         }
      } catch (e) {
         console.warn("Interpet Error: logging heap and names")
         console.warn(this.virtualCache)
         console.warn(this.variableNames)
         throw new ReferenceError("Unable to find the heap address for token1: " + token1)
      }
      try {
         if (typeof token2 === "string" && (token2 === this.tokens.UNIVERSAL_SET || token2 === this.tokens.NULL_SET)) {
            token2 = this.virtualCache[token2]
         } else if (typeof token2 === "string") {
            token2 = this.variableNames[token2]
         }
      } catch (e) {
         console.warn("Interpet Error: logging heap and names")
         console.warn(this.virtualCache)
         console.warn(this.variableNames)
         throw new ReferenceError("Unable to find the heap address or variableNames address for token2: " + token2)
      }
      // Now that the values have been re-trieved, make sure to terminate if the layer is one in length
      if (layer.length === 1) {
         return token1
      } else if (layer.length === 2) {
         console.warn("Interpet Error: logging heap and names");
         console.warn(this.virtualCache);
         console.warn(this.variableNames);
         throw new ReferenceError("Invalid sub-equation length two from AST layer: " + token1)
      }
      let memoryQueryOne = token1.uuid + operation + token2.uuid;
      let memoryQueryTwo = token2.uuid + operation + token1.uuid;
      // First, check the cache to see if these operations have been done before. 

      let currentHeapKeys: string[] = Object.keys(this.virtualCache)

      if (currentHeapKeys.indexOf(memoryQueryOne) !== -1) {
         return this.virtualCache[memoryQueryOne]
         // If the operation is a union, the order does not matter.
      } else if ((operation === this.tokens.UNION_OP || operation === this.tokens.INTERSECTION_OP) && currentHeapKeys.indexOf(memoryQueryTwo) !== -1) {
         return this.virtualCache[memoryQueryTwo]
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
         } else if (operation === this.tokens.SUBTRACTION_OP || operation === this.tokens.SYMM_DIFF_OP) {
            // Do some pointer assignments so 
            this.virtualCache[memoryQueryOne] = this.virtualCache[this.tokens.NULL_SET]
         }
         return this.virtualCache[memoryQueryOne]
      }

      /**
       * Intersection Calculautions
       */

      let token1JointBox: BoundingBox[] = token1.jointBoundingBox.getAllJointBoundingBoxes(JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY) as BoundingBox[]
      let token2JointBox: BoundingBox[] = token2.jointBoundingBox.getAllJointBoundingBoxes(JointBoundingBoxActions.RETURN_MODE_FULL_DIRECTORY) as BoundingBox[]

      let intersectionArr: BoundingBox[] = []

      for (let box1 of token1JointBox) {
         for (let box2 of token2JointBox) {
            // need to make these static
            let intersection = BoundingBox.boundingBoxIntersect(box1.boundingBox, box2.boundingBox);
            if (intersection[0]) {
               // Add these intersected sub box to the intersection box array.
               intersectionArr.push(new BoundingBox({
                  "boundingInputPayload": intersection[1] as CompleteBoundingBox,
                  "inputType": BoundingBoxPayloadModes.TYPE_BOUNDING_DIRECTORY
               }))
            }
         }
      }
      let intersectionJoint = new JointBoundingBox(intersectionArr);
      // What voxels from token 1 and 2 are in the overlapping. Only pulls from token 1 to prevent duplicates.
      let joint: Voxel[] = []
      // What are not in the joint. These coordinates could never overlap if both were unioned
      let token1NotInJoint: Voxel[] = []
      let token2NotInJoint: Voxel[] = []
      // Grab the voxels for each token
      let token1Voxels = token1.getFillVoxels();
      let token2Voxels = token2.getFillVoxels();
      for (let voxel of token1Voxels) {
         if (!intersectionJoint.isInside(voxel)) {
            token1NotInJoint.push(voxel);
         } else {
            joint.push(voxel)
         }
      }
      for (let voxel of token2Voxels) {
         if (!intersectionJoint.isInside(voxel)) {
            token2NotInJoint.push(voxel);
         }
      }
      let newFillVoxels: Voxel[] = []
      if (operation === this.tokens.INTERSECTION_OP) {
         if (joint.length === 0) {
            this.virtualCache[memoryQueryOne] = this.virtualCache[this.tokens.NULL_SET];
            return this.virtualCache[this.tokens.NULL_SET];
         } else {
            newFillVoxels = joint;
         }
      } else if (operation === this.tokens.UNION_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
         BaseObject.push2D(token2NotInJoint, newFillVoxels);
         BaseObject.push2D(joint, newFillVoxels);
      } else if (operation === this.tokens.SUBTRACTION_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
      } else if (operation === this.tokens.SYMM_DIFF_OP) {
         BaseObject.push2D(token1NotInJoint, newFillVoxels);
         BaseObject.push2D(token2NotInJoint, newFillVoxels);
      } else {
         throw new ReferenceError("Unknown operation: " + operation);
      }
      this.virtualCache[memoryQueryOne] = new VoxelCollection({
         "controller": this.controller,
         "origin": [0, 0, 0],
         "fillVoxels": newFillVoxels
      })
      return this.virtualCache[memoryQueryOne]
   }
   interpretAST(): void {
      this.tokens = SetOperationsParser.getSymbols();
      // Clear the past uuid strings from the controller for the cache
      let prevHeapKeys = Object.keys(this.virtualCache)
      for (let i = 0; i < prevHeapKeys.length; i++) {
         if (prevHeapKeys[i] !== this.tokens.UNIVERSAL_SET || prevHeapKeys[i] !== this.tokens.NULL_SET) {
            this.virtualCache[prevHeapKeys[i]].controller.removeID(this.virtualCache[prevHeapKeys[i]].uuid)
         }
      }
      this.virtualCache = {
         [this.tokens.UNIVERSAL_SET]: new VoxelCollection({
            controller: this.controller,
            fillVoxels: this.compositeObjects.reduce((accum, obj) => {
               return BaseObject.push2D(obj.getFillVoxels(), accum), accum
            }, []),
            origin: [0, 0, 0]
         }),
         [this.tokens.NULL_SET]: new VoxelCollection({
            controller: this.controller,
            fillVoxels: [],
            origin: [0, 0, 0]
         })
      }
      // This object is only temporary, but since it is the result from the recursive function, we can only remove the records after the stack collapse.
      let solvedASTJoint: VoxelCollection = this.#recursiveSolver(this.equationInstance.getAST(), 0)
      solvedASTJoint.controller.removeID(solvedASTJoint.uuid)
      this._fillVoxels = solvedASTJoint._fillVoxels
      // fill voxels has changed, so we need to calculaute bounding boxes again.
      this.calculateBoundingBox()
   }
}

export interface VectorVoxelExtrudeOptions {
   "controller": UUIDController,
   "origin": Voxel
   "extrudeVector": Voxel,
   "extrudeObject": Layer
}

export class LayerVectorExtrude extends BaseObject {
   extrudeVector: Voxel
   extrudeObject: Layer
   extrudeEndCap: Layer
   shell: boolean
   constructor(options: VectorVoxelExtrudeOptions) {
      super({
         "controller": options.controller,
         "origin": options.origin
      })
      this.extrudeVector = [...options.extrudeVector]
      this.extrudeObject = options.extrudeObject
      this.extrudeEndCap = new Layer({
         "controller": options.controller,
         "origin": options.origin,
         "verticesArray": []
      })
      this.shell = false
   }
   changeExtrudeVector(newVector: Voxel): LayerVectorExtrude {
      this.extrudeVector = [...newVector]
      this._fillVoxels = this.extrudeObject.getFillVoxels()
      this.calculateBoundingBox()
      this.shell = false
      return this
   }
   changeExtrudeObject(newObject: Layer): LayerVectorExtrude {
      this.extrudeObject = newObject
      this._fillVoxels = this.extrudeObject.getFillVoxels()
      this.calculateBoundingBox()
      this.shell = false
      return this
   }
   extrudeVoxels(shell: boolean): LayerVectorExtrude {
      this.shell = shell
      if ((this.extrudeVector[0] + this.extrudeVector[1] + this.extrudeVector[2]) === 0) {
         this._fillVoxels = this.extrudeObject.getFillVoxels()
         this.calculateBoundingBox()
         return this
      }
      this._fillVoxels = []
      let endCapVertices: Voxel[] = []
      // this.extrudeVector is parrel to a given Voxel
      if (shell) {
         for (let voxel of this.extrudeObject.getVerticeVoxels()) {
            endCapVertices.push(voxel.map((n, i) => n += this.extrudeVector[i]) as Voxel)
         }
         this.extrudeEndCap.changeVertices(endCapVertices).generateEdges().fillPolygon()
         let edgeDirectoryVoxels = this.extrudeObject.getEdgeVoxels()
         if (edgeDirectoryVoxels.length === 0) {
            console.warn("extrudeVoxels error dectected, printing layer:")
            console.warn(this.extrudeObject)
            throw new ReferenceError("LayerVectorExtrude layer " + this.extrudeObject.uuid + " has no voxels within the edge directory.")
         }
         for (let voxel of edgeDirectoryVoxels) {
            BaseObject.push2D(BaseObject.graph3DParametric(...voxel, ...(voxel.map((n, i) => n += this.extrudeVector[i]) as Voxel)).slice(1, -2), this._fillVoxels)
         }
         BaseObject.push2D(this.extrudeEndCap.getFillVoxels(), this._fillVoxels)
         BaseObject.push2D(this.extrudeObject.getFillVoxels(), this._fillVoxels)
      } else {
         for (let voxel of this.extrudeObject.getFillVoxels()) {
            BaseObject.push2D(BaseObject.graph3DParametric(...voxel, ...(voxel.map((n, i) => n += this.extrudeVector[i]) as Voxel)), this._fillVoxels)
         }
      }
      this.calculateBoundingBox()
      return this
   }
}

export interface LayerConvexExtrudeOptions {
   "controller": UUIDController,
   "origin": Voxel
   "extrudeObjects": Layer[]
}
export class LayerConvexExtrude extends BaseObject {
   extrudeObjects: Layer[]
   edgeDirectory: Record<string,  Voxel[]>
   constructor(options: LayerConvexExtrudeOptions) {
      super({
         "controller": options.controller,
         "origin": options.origin
      })
      this.extrudeObjects = options.extrudeObjects
      this.edgeDirectory = {}
   }
   pointOrientation(p1: Voxel, p2: Voxel, p3: Voxel): number {
      // If the slope from p1 to p2 is less than the slope from p2 to p3, 
      // then the points are trending counter clockwise. 
      return  (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p3[1] - p2[1]) * (p2[0] - p1[0])
   }
   convexHull(inputPoints: Voxel[]): Voxel[] {
      if (inputPoints.length <= 3) {
         return inputPoints
      }
      // Sort the data set from lowest x value to highest
      let sortedPoints = inputPoints.sort((a, b) => a[0] - b[0])
      let convexHull = [sortedPoints[0]]
      // Start with a point we know is on the hull
      let pointOnHull = sortedPoints[0]
      while (true) {
         for (let i = 1; i < sortedPoints.length; i++) {
            // Grab the potinal for the next point.
            let nextPoint = sortedPoints[i]
            // Loop back through again and confirm that this is the most counterclockwise point
            for (let j = 0; j < sortedPoints.length; j++) {
               // If a point on the hull is more counter clockwise than this current point
               if (this.pointOrientation(pointOnHull, nextPoint, sortedPoints[j]) < 0) {
                  // This should be the next point instead
                  nextPoint = [...sortedPoints[j]]
                  // And that when we come back around for a new nextPoint, 
                  // don't go back over values already checked.
                  i = j
               }
            }
            // If we have come back around
            if (JSON.stringify(nextPoint) === JSON.stringify(sortedPoints[0])) {
               return convexHull
            }
            // After we found the new value of the nextPoint, add it to the hull
            convexHull.push([...nextPoint])
            // Now we restart the loop again, with this new hull point.
            pointOnHull = [...nextPoint]
         }
      }
   }
   generateEdges(): LayerConvexExtrude  {
      this.edgeDirectory = {
         
      }
      this._fillVoxels = []
      // 1 2
      // 0 1
      let sectionKey = 0;
      let sectionVoxelCollection = new VoxelCollection({
         "controller": this.controller,
         "origin": this._origin,
         "fillVoxels": []
      })
      for (let i = 0; i < this.extrudeObjects.length; i++) {
         this.edgeDirectory[sectionKey] = []
         sectionVoxelCollection.setFillVoxels([])
         if (i+1 < this.extrudeObjects.length) {
            let startObject = this.extrudeObjects[i]
            let endObject = this.extrudeObjects[i+1]
            // Generate lines betwene all vertices, slice off from 1 to -1
            let startV = startObject.getVerticeVoxels()
            let endV = endObject.getVerticeVoxels()
            for (let SV of startV) {
               for (let EV of endV) {
                  this.edgeDirectory[sectionKey].push()
               }
            }
         }
      }
      return this
   }
}
