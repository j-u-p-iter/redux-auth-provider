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

  beforeAll(() => {
    nock(BASE_URL)
      .persist()
      .post("/api/v1/auth/sign-in")
      .reply(200, {
        data: {
          user: { id: 1, name: "some name", email: "some@email.com" },
          accessToken: "someAccessToken"
        }
      });

    nock(BASE_URL, {
      reqheaders: {
        Authorization: `Bearer someAccessToken`
      }
    })
      .get("/api/v1/auth/current-user")
      .reply(200, {
        data: { user: { id: 1, name: "some name", email: "some@email.com" } }
      });

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
        const { mutation: signIn, isLoading } = useMutation("signIn");

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
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

  describe("signUp", () => {
    beforeEach(() => {
      nock(BASE_URL)
        .post("/api/v1/auth/sign-up")
        .reply(200, {
          data: {
            user: { id: 1, name: "some name", email: "some@email.com" },
            accessToken: "someAccessToken"
          }
        });

      TestComponent = () => {
        const { currentUser, isSignedIn } = useStoreState();
        const { mutation: signUp, isLoading } = useMutation("signUp");

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
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

  describe("getCurrentUser", () => {
    beforeEach(async () => {
      TestComponent = () => {
        const { isSignedIn } = useStoreState();
        const { data: currentUser, isLoading } = useQuery();

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
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

  describe("signOut", () => {
    beforeEach(() => {
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
