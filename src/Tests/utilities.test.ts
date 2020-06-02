import "@testing-library/jest-dom/extend-expect";
import { getDefaultLaneBorders } from '../utilities'

/**
 * A very simple test to the function's output
 */
test('ONE: checks that getDefaultLaneBorders works as expected', async () => {
  const borders = getDefaultLaneBorders(100, 5, 0.8);
  expect(borders).toEqual([[2, 18], [22, 38], [42, 58], [62, 78], [82, 98]]);
});

/**
 * A very simple test to the function's output
 */
test('TWO: checks that getDefaultLaneBorders works as expected', async () => {
  const borders = getDefaultLaneBorders(100, 5, 0.4);
  expect(borders).toEqual([[6, 14], [26, 34], [46, 54], [66, 74], [86, 94]]);
});