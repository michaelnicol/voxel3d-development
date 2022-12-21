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
type Voxel = [number, number, number];

/**
 * Valid corner keys for {@link PartialBoundingBox} and {@link CompleteBoundingBox}
 */
type VALID_BOUNDING_KEY = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7"

/**
 * Holds the data for the corners of a rectangle. This data type is to be used when the box is incomplete with one or more corner data missing.
 * 
 * @remarks
 * This type is used for internal calculations of {@link BoundingBox}. The intersection of two boxes may produce a partial box, requiring correction.
 * 
 */
interface PartialBoundingBox {
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
 * Holds the data for the corners of a rectangle. This data type is to be used when the box is complete.
 * 
*/
interface CompleteBoundingBox {
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
            return prev.push(...JSON.parse(JSON.stringify(curr))), prev;
         } else if (mode === JointBoundingBoxActions.RETURN_MODE_VOXELS_DIRECTORY) {
            return prev.push(...JSON.parse(JSON.stringify(curr.boundingBox))), prev;
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
      this.calculateRange()
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
    * Calculates all of the metadata based on the current {@link BoundingBox.boundingBox}. This includes the point extremes and ranges on all three axes.
    * @param array2D 
    */
   calculateRange(): void {
      let array2D = BoundingBox.compileBoundingDirectory(this.boundingBox)
      let xValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[0]), prev }, []).sort((a, b) => a - b)
      let yValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[1]), prev }, []).sort((a, b) => a - b)
      let zValues = array2D.reduce<number[]>((prev, curr) => { return prev.push(curr[2]), prev }, []).sort((a, b) => a - b)
      this.xLow = xValues[0]
      this.xHigh = xValues[xValues.length - 1]
      this.yLow = yValues[1]
      this.yHigh = yValues[yValues.length - 1]
      this.zLow = zValues[2]
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
         this.calculateRange();
         this.boundingBox[0] = [this.xLow, this.yLow, this.zLow]
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
   * @remarks Generates a new {@link BoundingBox.boundingBox} from the intersection between two inputted boxes. Used to find the cubic range area that is shared between two boxes, if any.
   * @param b1 Box 1
   * @param b2 Box 2
   * @returns Returns an array, and if the first element is true, then the second element is the intersection {@link BoundingBox.boundingBox}. Otherwise, the intersection is not possible (false).
   */
   static boundingBoxIntersect(b1: CompleteBoundingBox, b2: CompleteBoundingBox): CompleteBoundingBox {
      const b3: PartialBoundingBox = BoundingBox.getEmptyBoundingTemplate()
      for (let xp of this.#VP[0]) {
         // check if b1 is inside b2
         // if xp0 and xp1's vectors extending infitly in x direction,
         // pass through planes defined by 0,4,2 and 1,5,3
         let left = BoundingBox.horizontalCheck(b1[xp[0] + "" as VALID_BOUNDING_KEY], b2[0], b2[2], b2[4]);
         let right = BoundingBox.horizontalCheck(b1[xp[1] + "" as VALID_BOUNDING_KEY], b2[1], b2[3], b2[5]);
         if (left && right) {
            // b1-left-x >= b2-0-x
            if (b1[xp[0] + "" as VALID_BOUNDING_KEY][0] <= b2[0][0]) {
               // b3-left = b2-0-x, b1-left-y, b1-left-z
               b3[xp[0] + "" as VALID_BOUNDING_KEY] = [b2[0][0], b1[xp[0] + "" as VALID_BOUNDING_KEY][1], b1[xp[0] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-left = b1-left
               b3[xp[0] + "" as VALID_BOUNDING_KEY] = [...b1[xp[0] + "" as VALID_BOUNDING_KEY]];
            }
            // b1-right-x >= b2-right-x
            if (b1[xp[1] + "" as VALID_BOUNDING_KEY][0] >= b2[1][0]) {
               // b3-right = b2-right-x, b1-right-y, b1-right-z
               b3[xp[1] + "" as VALID_BOUNDING_KEY] = [b2[1][0], b1[xp[1] + "" as VALID_BOUNDING_KEY][1], b1[xp[1] + "" as VALID_BOUNDING_KEY][2]]
            } else {
               // b3-right = b1-right
               b3[xp[1] + "" as VALID_BOUNDING_KEY] = [...b1[xp[1] + "" as VALID_BOUNDING_KEY]];
            }
         }
      }
      for (let yp of this.#VP[1]) {
         // if down's vectors extends through plane 0, 1, 4
         let down = BoundingBox.verticalCheck(b1[yp[0] + "" as VALID_BOUNDING_KEY], b2[0], b2[1], b2[4]);
         // if ups vectors extends through plane 2, 3, 6
         let up = BoundingBox.verticalCheck(b1[yp[1] + "" as VALID_BOUNDING_KEY], b2[2], b2[3], b2[6]);
         if (up && down) {
            // b1-down-y >= b2-2-y
            if (b1[yp[0] + "" as VALID_BOUNDING_KEY][1] <= b2[1][1]) {
               // b3-down = b1-down-x, b2-0-y, b1-down-z
               b3[yp[0] + "" as VALID_BOUNDING_KEY] = [b1[yp[0] + "" as VALID_BOUNDING_KEY][0], b2[0][1], b1[yp[0] + "" as VALID_BOUNDING_KEY][2]];
            } else {
               // b3-down = b1-down
               b3[yp[0] + "" as VALID_BOUNDING_KEY] = [...b1[yp[0] + "" as VALID_BOUNDING_KEY]]
            }
            // b1-up-y >= b2-2-y
            if (b1[yp[1] + "" as VALID_BOUNDING_KEY][1] >= b2[2][1]) {
               // b3-up = b1-up-x, b2-0-y, b1-up-z
               b3[yp[1] + "" as VALID_BOUNDING_KEY] = [b1[yp[1] + "" as VALID_BOUNDING_KEY][0], b2[2][1], b1[yp[1] + "" as VALID_BOUNDING_KEY][2]];
            } else {
               // b3-up = b2-up
               b3[yp[1] + "" as VALID_BOUNDING_KEY] = [...b1[yp[1] + "" as VALID_BOUNDING_KEY]]
            }
         }
      }
      for (let zp of this.#VP[2]) {
         // if closet point vector extends through plane 4,5,6
         let closet = BoundingBox.depthCheck(b1[zp[0] + "" as VALID_BOUNDING_KEY], b2[0], b2[1], b2[2]);
         // if farthest points vector extends through 0,1,2
         let further = BoundingBox.depthCheck(b1[zp[1] + "" as VALID_BOUNDING_KEY], b2[4], b2[5], b2[6]);
         // if both these poins align through the planes
         if (closet && further) {
            // b1-close-z <= b2-0-z
            if (b1[zp[0] + "" as VALID_BOUNDING_KEY][2] <= b2[0][2]) {
               // b3-close = close-x, close-y b2-0-z
               b3[zp[0] + "" as VALID_BOUNDING_KEY] = [b1[zp[0] + "" as VALID_BOUNDING_KEY][0], b1[zp[0] + "" as VALID_BOUNDING_KEY][1], b2[0][2]];
            } else {
               // b3-close = b1-close
               b3[zp[0] + "" as VALID_BOUNDING_KEY] = [...b1[zp[1] + "" as VALID_BOUNDING_KEY]]
            }
            // b1-far-z >= b2-6-2
            if (b1[zp[1] + "" as VALID_BOUNDING_KEY][2] >= b2[6][2]) {
               // b3-far = far-x. far-y. b2-6-z
               b3[zp[1] + "" as VALID_BOUNDING_KEY] = [b1[zp[1] + "" as VALID_BOUNDING_KEY][0], b1[zp[1] + "" as VALID_BOUNDING_KEY][1], b2[6][2]];
            }
         }
      }
      return BoundingBox.correctBoundingBox(b3)[1] as CompleteBoundingBox
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
         switch (i) {
            case 9:
            case 14:
            case 19:
            case 24:
               uuid += "-"
               break;
            default:
               uuid += this._randomChar()
         }
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
    * @remarks
    * Accounts for origin.
    */
   boundingBox: BoundingBox
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
      let output: SortFillVoxelsOutput = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox)
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
    */
   calculateBoundingBox(): void {
      this.boundingBox = new BoundingBox({
         inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
         boundingInputPayload: this.getFillVoxels()
      });
      let output: SortFillVoxelsOutput = BaseObject.sortFillVoxels(this.getFillVoxels(), this.boundingBox)
      this.sortedFillVoxelsDirectory = output.sortedFillVoxelsDirectory
      this.jointBoundingBox = output.jointBoundingBox
   }
   /**
    * Changes the current shapes origin and calls {@link BaseObject.calculateBoundingBox}
    * @param o New Origin
    * 
    * @example
    * // Source code
    * this._origin = [...o]
    * this.calculateBoundingBox()
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
         sliceBoundingBoxDirectory.push(new BoundingBox({
            inputType: BoundingBoxPayloadModes.TYPE_BOUNDING_POINTS,
            boundingInputPayload: sortedFillVoxelsDirectory[fillKey]
         })
         )
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
interface LineOptions {
   "controller": UUIDController,
   "origin": Voxel,
   /**
    * The [start, end] points of the line.
    */
   "endPoints": [Voxel, Voxel]
}


/**
 * Used for {@link Line.generateLine} to decide how the line should be generated.
 * 
 * A single pass will generate the line from start to end via {@link BaseObject.graph3DParametric}, and set the fill voxels
 * 
 * Double pass will generate from start to end, and then end to start. It will combine both lines into one and set the fill voxels.
 * 
 * For more information, see {@link BaseObject.graph3DParametric}
 */
enum LineTypes {
   SINGLE_PASS_LINE = "SINGLE_PASS_LINE",
   DOUBLE_PASS_LINE = "DOUBLE_PASS_LINE"
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
 * {@link LineTypes}
 * 
 * {@link LineOptions}
 */
class Line extends BaseObject {
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
    * @param mode See {@link LineTypes} for more information.
    */
   generateLine(mode: LineTypes) {
      const { biggestRangeIndex } = this.boundingBox;
      let startToEnd = BaseObject.graph3DParametric(
         ...this._endPoints[0],
         ...this._endPoints[1]
      );
      if (mode === LineTypes.DOUBLE_PASS_LINE) {
         let endToStart = BaseObject.graph3DParametric(
            ...this._endPoints[1],
            ...this._endPoints[0]
         ).reverse();
         // pushes to fill voxels
         for (let j = 0; j < endToStart.length; j++) {
            // If a item parrel to 
            if (JSON.stringify(endToStart[j]) !== JSON.stringify(startToEnd[j])) {
               this._fillVoxels.push(endToStart[j])
            }
            this._fillVoxels[j]
         }
      } else {
         BaseObject.push2D(startToEnd, this._fillVoxels);
      }
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
interface LayerOptions {
   "controller": UUIDController,
   "origin": Voxel,
   "verticesArray": Voxel[]
}

/**
 * Stores data structures required to create a 3D polygon in 3D space.
 */
class Layer extends BaseObject {
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
    */
   changeVertices(verticesArray: Voxel[]): void { // done
      this._verticesArray = BaseObject.deepCopy(verticesArray)
      this._fillVoxels = [...this._verticesArray]
      this.calculateBoundingBox()
      this.edgeDirectory = {}
   }
   /**
    * Generates the entries of {@link Layer.edgeDirectory}, where each entry is a line that connects one vertice to another.
    * 
    * Use {@link Layer.getEdgeVoxels} to acess all edge voxels as a single array.
    * 
    * Also adds all voxels from the edge directory to the {@link Layer._fillVoxels}.
    */
   generateEdges() {
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
            tempLine.generateLine(LineTypes.DOUBLE_PASS_LINE)
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
   }
   /**
    * Uses the {@link Layer.sortedFillVoxelsDirectory} generated from the {@link Layer._fillVoxels} generated from {@link Layer.generateEdges} to fill in the shape.
    * 
    * Sets {@link Layer._fillVoxels} and calculautes bounding box.
    */
   fillPolygon(): void {
      this._fillVoxels = []
      let temporary2DSlice = new Layer({
         verticesArray: [[0, 0, 0]],
         origin: this.getOrigin(),
         controller: this.controller
      })
      for (let entry of Object.keys(this.sortedFillVoxelsDirectory)) {
         let currentEntry = Number(entry)
         let entryVoxels = this.sortedFillVoxelsDirectory[currentEntry as keyof SortedFillVoxelsDirectoryType];
         temporary2DSlice.changeVertices(entryVoxels);
         temporary2DSlice.generateEdges();
         BaseObject.push2D(temporary2DSlice.getFillVoxels(), this._fillVoxels)
      }
      this.calculateBoundingBox();
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
   getVerticeVoxels() {
      return BaseObject.addOrigin(this._verticesArray, this._origin);
   }
}
