import {
  createBaseRESTAuthProvider,
  OAuthClientName
} from "@j.u.p.iter/auth-provider";
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
    successfulSignIn = (path, params) => {
      const resultPath = path || "auth/sign-in";

      nock(BASE_URL)
        .post(`/api/v1/${resultPath}`, params)
        .reply(200, {
          data: {
            user: { id: 1, name: "some name", email: "some@email.com" },
            accessToken: "someAccessToken"
          }
        });
    };

    failedSignIn = (path, params) => {
      const resultPath = path || "auth/sign-in";

      nock(BASE_URL)
        .post(`/api/v1/${resultPath}`, params)
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
        initialState: { auth: initialState }
      });
    };
  });

  afterEach(() => {
    cleanup();
  });

  describe("signIn", () => {
    describe("without oauth client", () => {
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
                onClick={() => signIn({ userData: { name: "some name" } })}
              >
                Sign in user
              </button>
            </div>
          );
        };
      });

      describe("when request fails with error", () => {
        beforeEach(() => {
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
        beforeEach(() => {
          successfulSignIn();
        });

        it("sign in user and put current user data into redux store", async () => {
          const { queryByText, queryByTestId } = renderComponent();

          expect(queryByText("No current user data")).not.toBe("null");
          expect(queryByTestId("profile")).toBe(null);

          fireEvent.click(queryByTestId("signInUser"));

          expect(queryByTestId("spinner")).not.toBe(null);

          await wait(() => expect(queryByTestId("spinner")).toBe(null));

          expect(queryByTestId("currentUserName").textContent).toBe(
            "some name"
          );

          expect(queryByTestId("currentUserEmail").textContent).toBe(
            "some@email.com"
          );
        });
      });
    });

    describe("with oauth client", () => {
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
                onClick={() =>
                  signIn({
                    oauthClientName: OAuthClientName.Google,
                    code: "some-code"
                  })
                }
              >
                Sign in user
              </button>
            </div>
          );
        };
      });

      describe("when request fails with error", () => {
        beforeEach(() => {
          failedSignIn("oauth/google/sign-in", { code: "some-code" });
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
        beforeEach(() => {
          successfulSignIn("oauth/google/sign-in", { code: "some-code" });
        });

        it("sign in user and put current user data into redux store", async () => {
          const { queryByText, queryByTestId } = renderComponent();

          expect(queryByText("No current user data")).not.toBe("null");
          expect(queryByTestId("profile")).toBe(null);

          fireEvent.click(queryByTestId("signInUser"));

          expect(queryByTestId("spinner")).not.toBe(null);

          await wait(() => expect(queryByTestId("spinner")).toBe(null));

          expect(queryByTestId("currentUserName").textContent).toBe(
            "some name"
          );

          expect(queryByTestId("currentUserEmail").textContent).toBe(
            "some@email.com"
          );
        });
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
      beforeEach(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/sign-up")
          .reply(400, {
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
      beforeEach(() => {
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

  describe("updateCurrentUser", () => {
    beforeEach(async () => {
      successfulSignIn();

      TestComponent = () => {
        const {
          mutation: updateCurrentUser,
          isLoading,
          error,
          data: currentUser
        } = useMutation("updateCurrentUser");

        useEffect(() => {
          updateCurrentUser({ email: "someEmail@email.com" });
        }, []);

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return (
          <div data-testid="profile">
            <div data-testid="currentUserName">{currentUser.name}</div>
            <div data-testid="currentUserEmail">{currentUser.email}</div>
          </div>
        );
      };

      await authProvider.signIn({ userData: { id: 1 } });
    });

    describe("when request fails with error", () => {
      beforeEach(() => {
        nock(BASE_URL, {
          reqheaders: {
            Authorization: `Bearer someAccessToken`
          }
        })
          .put("/api/v1/auth/current-user")
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
      describe("when there is such a user", () => {
        beforeEach(() => {
          nock(BASE_URL, {
            reqheaders: {
              Authorization: `Bearer someAccessToken`
            }
          })
            .put("/api/v1/auth/current-user")
            .reply(200, {
              data: {
                user: { id: 1, name: "some name", email: "some@email.com" }
              }
            });
        });

        it("update current user and put updated data into redux store", async () => {
          const { queryByText, queryByTestId } = renderComponent();

          expect(queryByText("spinner")).not.toBe("null");

          await wait(() => expect(queryByTestId("spinner")).toBe(null));

          expect(queryByTestId("currentUserName").textContent).toBe(
            "some name"
          );
          expect(queryByTestId("currentUserEmail").textContent).toBe(
            "some@email.com"
          );
        });
      });
    });
  });

  describe("resetPassword", () => {
    beforeEach(async () => {
      TestComponent = () => {
        const { isLoading, error, mutation: resetPassword } = useMutation(
          "resetPassword"
        );

        useEffect(() => {
          resetPassword({ token: "someToken", password: "someNewPassword" });
        }, []);

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return (
          <div data-testid="successMessage">
            Password was successfully restored.
          </div>
        );
      };
    });

    describe("when request fails with error", () => {
      beforeEach(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/reset-password")
          .reply(404, {
            error: "Token is not correct"
          });
      });

      it("shows error message", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("errorMessage").textContent).toBe(
          "Token is not correct"
        );
      });
    });

    describe("when request successfully was resolved", () => {
      beforeEach(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/reset-password")
          .reply(200);
      });

      it("shows successful message", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("successMessage").textContent).toBe(
          "Password was successfully restored."
        );
      });
    });
  });

  describe("askNewPassword", () => {
    beforeEach(async () => {
      TestComponent = () => {
        const { isLoading, error, mutation: askNewPassword } = useMutation(
          "askNewPassword"
        );

        useEffect(() => {
          askNewPassword({ email: "some@email.com" });
        }, []);

        if (isLoading) {
          return <div data-testid="spinner">Loading...</div>;
        }

        if (error) {
          return <div data-testid="errorMessage">{error}</div>;
        }

        return (
          <div data-testid="successMessage">
            Password was sent to your email.
          </div>
        );
      };
    });

    describe("when request fails with error", () => {
      beforeEach(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/ask-new-password")
          .reply(404, {
            error: "No user with such email"
          });
      });

      it("shows error message", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("errorMessage").textContent).toBe(
          "No user with such email"
        );
      });
    });

    describe("when request successfully was resolved", () => {
      beforeEach(() => {
        nock(BASE_URL)
          .post("/api/v1/auth/ask-new-password")
          .reply(200);
      });

      it("shows successful message", async () => {
        const { queryByText, queryByTestId } = renderComponent();

        expect(queryByText("spinner")).not.toBe("null");

        await wait(() => expect(queryByTestId("spinner")).toBe(null));

        expect(queryByTestId("successMessage").textContent).toBe(
          "Password was sent to your email."
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

      await authProvider.signIn({ userData: { id: 1 } });
    });

    describe("when request fails with error", () => {
      beforeEach(() => {
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
      describe("when there is such a user", () => {
        beforeEach(() => {
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

          expect(queryByTestId("currentUserName").textContent).toBe(
            "some name"
          );
          expect(queryByTestId("currentUserEmail").textContent).toBe(
            "some@email.com"
          );
        });
      });

      describe("when there is no such a user", () => {
        beforeEach(() => {
          nock(BASE_URL, {
            reqheaders: {
              Authorization: `Bearer someAccessToken`
            }
          })
            .get("/api/v1/auth/current-user")
            .reply(200, {
              data: {
                user: null
              }
            });
        });

        it("reset auth state in store", async () => {
          const { queryByText, queryByTestId } = renderComponent();

          expect(queryByText("spinner")).not.toBe("null");

          await wait(() => expect(queryByTestId("spinner")).toBe(null));

          expect(queryByTestId("profile")).toBe(null);
        });
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
          signIn({ userData: { id: 1 } });
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
