type CreateActionFn = <T, D>(
  type: T,
  data?: D
) => {
  type: T;
  payload: {
    data: D;
  };
};

export const createAction: CreateActionFn = (type, data) => ({
  type,
  payload: { data }
});

type CreateActionNameFn = (actionBaseName: string) => string;
const createActionName: CreateActionNameFn = actionBaseName => {
  const actionNameScope = "REDUX_AUTH_PROVIDER";

  return `${actionNameScope}:${actionBaseName}`;
};

export const FETCH_CURRENT_USER_WITH_SUCCESS = createActionName(
  "FETCH_CURRENT_USER_WITH_SUCCESS"
);

export const UPDATE_CURRENT_USER_WITH_SUCCESS = createActionName(
  "UPDATE_CURRENT_USER_WITH_SUCCESS"
);

export const SIGN_UP_WITH_SUCCESS = createActionName("SIGN_UP_WITH_SUCCESS");

export const SIGN_IN_WITH_SUCCESS = createActionName("SIGN_IN_WITH_SUCCESS");

export const SIGN_OUT = createActionName("SIGN_OUT");

type UserData = any;

export interface State {
  currentUser: UserData;
  isSignedIn: boolean;
}

export const initialState: State = {
  currentUser: null,
  isSignedIn: null
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CURRENT_USER_WITH_SUCCESS:
    case SIGN_UP_WITH_SUCCESS:
    case SIGN_IN_WITH_SUCCESS:
      return {
        ...state,
        currentUser: action.payload.data,
        isSignedIn: true
      };

    case UPDATE_CURRENT_USER_WITH_SUCCESS:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          ...action.payload.data
        }
      };

    case SIGN_OUT:
      return {
        ...state,
        currentUser: null,
        isSignedIn: false
      };

    default:
      return state;
  }
};
