const SEAT_A = { xMin: -5, xMax: 2.5, yMin: 2, yMax: 8 };
const SEAT_B = { xMin: 2.5, xMax: 10, yMin: 2, yMax: 8 };
const SEAT_C = { xMin: -5, xMax: 2.5, yMin: -4, yMax: 2 };
const SEAT_D = { xMin: 2.5, xMax: 10, yMin: -4, yMax: 2 };

let seats = {
  A: { id: "A", area: SEAT_A, occupied: false, inCnt: 0, outCnt: 0, startTime: null },
  B: { id: "B", area: SEAT_B, occupied: false, inCnt: 0, outCnt: 0, startTime: null },
  C: { id: "C", area: SEAT_C, occupied: false, inCnt: 0, outCnt: 0, startTime: null },
  D: { id: "D", area: SEAT_D, occupied: false, inCnt: 0, outCnt: 0, startTime: null }
};

function isInside(x, y, area) {
  return (x >= area.xMin && x <= area.xMax && y >= area.yMin && y <= area.yMax);
}