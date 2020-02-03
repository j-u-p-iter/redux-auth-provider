import { createBaseRESTAuthProvider } from "@j.u.p.iter/auth-provider";
import { renderReduxComponent } from "@j.u.p.iter/react-test-utils";
import { cleanup, fireEvent, wait } from "@testing-library/react";
import nock from "nock";
import React, { FC, useEffect } from "react";
import { createReduxAuthProvider } from ".";
import { initialState, reducer } from "./reducer";
import { useStoreState } from "./useStoreState";

describe("reduxAuthProvider", () => {
  const BASE_URL = "https://some-host.com";
  let renderComponent;
  let TestComponent: FC;
  let useQuery;
  let useMutation;
  let authProvider;
  let successfulSignIn;
  let failedSignIn;

  beforeAll(() => {
    successfulSignIn = () => {
      nock(BASE_URL)
        .post("/api/v1/auth/sign-in")
        .reply(200, {
          data: {
            user: { id: 1, name: "some name", email: "some@email.com" },
            accessToken: "someAccessToken"
          }
        });
    };

    failedSignIn = () => {
      nock(BASE_URL)
        .post("/api/v1/auth/sign-in")
        .reply(400, { error: "some error message" });
    };

    authProvider = createBaseRESTAuthProvider({
      host: BASE_URL.replace("https://", "")
    });
    ({ useQuery, useMutation } = createReduxAuthProvider(authProvider));

    renderComponent = () => {
      return renderReduxComponent({
        ui: <TestComponent />,
        rootReducer: (state, action) => ({ auth: reducer(state, action) }),
        initialState: {
          auth: initialState
        }
      });
    };
  });

  afterEach(cleanup);

  describe("signIn", () => {
    beforeEach(() => {
      TestComponent = () => {
        const { currentUser, isSignedIn } = useStoreState();
        const { mutation: signIn, isLoading, error } = useMutation("signIn");

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return isSignedIn ? (
          <div data-testid="profile">
            <div data-testid="currentUserName">{currentUser.name}</div>
            <div data-testid="currentUserEmail">{currentUser.email}</div>
          </div>
        ) : (
          <div>
            <p>No current user data</p>
            <button
              data-testid="signInUser"
              onClick={() => signIn({ name: "some name" })}
            >
              Sign in user
            </button>
          </div>
        );
      };
    });

    describe("when request fails with error", () => {
      beforeAll(() => {
        failedSignIn();
      });

      it("handles error properly", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("No current user data")).not.toBe("null");
        expect(queryByTestId("profile")).toBe(null);

        fireEvent.click(queryByTestId("signInUser"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("errorMessage").textContent).toBe(
          "some error message"
        );
      });
    });

    describe("when request successfuly resolved", () => {
      beforeAll(() => {
        successfulSignIn();
      });

      it("sign in user and put current user data into redux store", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("No current user data")).not.toBe("null");
        expect(queryByTestId("profile")).toBe(null);

        fireEvent.click(queryByTestId("signInUser"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("currentUserName").textContent).toBe("some name");

        expect(queryByTestId("currentUserEmail").textContent).toBe(
          "some@email.com"
        );
      });
    });
  });

  describe("signUp", () => {
    beforeEach(() => {
      TestComponent = () => {
        const { isSignedIn } = useStoreState();
        const {
          mutation: signUp,
          isLoading,
          error,
          data: currentUser
        } = useMutation("signUp");

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return isSignedIn ? (
          <div data-testid="profile">
            <div data-testid="currentUserName">{currentUser.name}</div>
            <div data-testid="currentUserEmail">{currentUser.email}</div>
          </div>
        ) : (
          <div>
            <p>No current user data</p>
            <button
              data-testid="signUpUser"
              onClick={() => signUp({ name: "some name" })}
            >
              Sign up user
            </button>
          </div>
        );
      };
    });

    describe("when request fails with error", () => {
      beforeAll(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/sign-up")
          .reply(200, {
            error: "some error message"
          });
      });

      it("sign up user and put current user data into redux store", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("No current user data")).not.toBe("null");
        expect(queryByTestId("profile")).toBe(null);

        fireEvent.click(queryByTestId("signUpUser"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => expect(queryByTestId("spinner")).toBe(null));
        expect(queryByTestId("errorMessage").textContent).toBe(
          "some error message"
        );
      });
    });

    describe("when request successfuly resolved", () => {
      beforeAll(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/sign-up")
          .reply(200, {
            data: {
              user: { id: 1, name: "some name", email: "some@email.com" },
              accessToken: "someAccessToken"
            }
          });
      });

      it("sign up user and put current user data into redux store", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("No current user data")).not.toBe("null");
        expect(queryByTestId("profile")).toBe(null);

        fireEvent.click(queryByTestId("signUpUser"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => expect(queryByTestId("spinner")).toBe(null));
        expect(queryByTestId("currentUserName").textContent).toBe("some name");

        expect(queryByTestId("currentUserEmail").textContent).toBe(
          "some@email.com"
        );
      });
    });
  });

  describe("getCurrentUser", () => {
    beforeEach(async () => {
      successfulSignIn();

      TestComponent = () => {
        const { isSignedIn } = useStoreState();
        const { data: currentUser, isLoading, error } = useQuery();

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return isSignedIn ? (
          <div data-testid="profile">
            <div data-testid="currentUserName">{currentUser.name}</div>
            <div data-testid="currentUserEmail">{currentUser.email}</div>
          </div>
        ) : null;
      };

      await authProvider.signIn({ id: 1 });
    });

    describe("when request fails with error", () => {
      beforeAll(() => {
        nock(BASE_URL, {
          reqheaders: {
            Authorization: `Bearer someAccessToken`
          }
        })
          .get("/api/v1/auth/current-user")
          .reply(400, {
            error: "some error message"
          });
      });

      it("fetch current user and put it into redux store", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("errorMessage").textContent).toBe(
          "some error message"
        );
      });
    });

    describe("when request successfuly resolves", () => {
      beforeAll(() => {
        nock(BASE_URL, {
          reqheaders: {
            Authorization: `Bearer someAccessToken`
          }
        })
          .get("/api/v1/auth/current-user")
          .reply(200, {
            data: {
              user: { id: 1, name: "some name", email: "some@email.com" }
            }
          });
      });

      it("fetch current user and put it into redux store", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("currentUserName").textContent).toBe("some name");
        expect(queryByTestId("currentUserEmail").textContent).toBe(
          "some@email.com"
        );
      });
    });
  });

  describe("signOut", () => {
    beforeEach(() => {
      successfulSignIn();

      TestComponent = () => {
        const { isSignedIn, currentUser } = useStoreState();
        const { mutation: signIn } = useMutation("signIn");
        const { mutation: signOut } = useMutation("signOut");

        useEffect(() => {
          signIn({ id: 1 });
        }, []);

        return isSignedIn ? (
          <div data-testid="profile">
            <div data-testid="currentUserName">{currentUser.name}</div>
            <div data-testid="currentUserEmail">{currentUser.email}</div>
            <button data-testid="signOutUser" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p>No current user data</p>
          </div>
        );
      };
    });

    it("removes user from redux store and remove session", async () => {
      const { queryByTestId } = renderComponent();

      await wait(() => expect(queryByTestId("profile")).not.toBe(null));

      fireEvent.click(queryByTestId("signOutUser"));

      expect(queryByTestId("profile")).toBe(null);
    });
  });
});
