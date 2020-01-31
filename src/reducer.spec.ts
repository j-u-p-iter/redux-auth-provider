import { initialState, reducer } from ".";

describe("reducer", () => {
  it("returns initial state by default", () => {
    expect(reducer(undefined, {})).toEqual(initialState);
  });
});
