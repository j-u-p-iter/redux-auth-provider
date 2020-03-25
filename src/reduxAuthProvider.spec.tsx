import {
  createBaseRESTAuthProvider,
  OAuthClientName
} from "@j.u.p.iter/auth-provider";
import { renderReduxComponent } from "@j.u.p.iter/react-test-utils";
import { cleanup, fireEvent, wait } from "@testing-library/react";
import axios from "axios";
import nock from "nock";
import React, { FC, useEffect, useState } from "react";
import { createReduxAuthProvider } from ".";
import { initialState, reducer } from "./reducer";
import { useStoreState } from "./useStoreState";

describe("reduxAuthProvider", () => {
  const BASE_URL = "https://some-host.com";
  let renderComponent;
  let TestComponent: FC;
  let useQuery;
  let useMutation;
  let useCheckError;
  let authProvider;
  let successfulSignIn;
  let failedSignIn;
  const redirectHelper = jest.fn();

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
      redirectHelper,
      host: BASE_URL.replace("https://", "")
    });
    ({ useQuery, useMutation, useCheckError } = createReduxAuthProvider(
      authProvider
    ));

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
    redirectHelper.mockReset();
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

  describe("useCheckError", () => {
    let setUpCheckingError;
    // testing plan
    // 1. in case of 401 error:
    // 1.1. sign out user
    // 1.2. redirect properly according to redirectConfig
    //
    // 2. in case of 403 error:
    // 2.1 redirect properly according to redirectConfig and preserve session.
    beforeEach(() => {
      setUpCheckingError = checkError => {
        axios.interceptors.response.use(null, error => {
          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(error);

              checkError(
                { status: error.response.status },
                {
                  401: "/redirect-after-401",
                  403: "/redirect-after-403"
                }
              );
            }, 500);
          });
        });
      };
    });

    describe("in case of 401 error", () => {
      beforeEach(async () => {
        nock(BASE_URL, {
          reqheaders: {
            Authorization: `Bearer someAccessToken`
          }
        })
          .get("/api/v1/auth/current-user")
          .reply(401, { error: "some error message" });

        successfulSignIn();

        const ProfileData = () => {
          useQuery();

          return <div data-testid="profileData">Profile data</div>;
        };

        const LoginPage = () => {
          return <div data-testid="loginPage">Login form is here</div>;
        };

        TestComponent = () => {
          const { isSignedIn } = useStoreState();
          const { mutation: signIn } = useMutation("signIn");
          const [showUserData, setShowUserData] = useState(false);

          const checkError = useCheckError();

          useEffect(() => {
            setUpCheckingError(checkError);

            signIn({ userData: { id: 1 } });
          }, []);

          return (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => setShowUserData(true)}
                  data-testid="showUserData"
                >
                  Show user data
                </button>
              ) : (
                <LoginPage />
              )}
              {showUserData ? <ProfileData /> : null}
            </>
          );
        };
      });

      it("removes session and redirects according to redirectConfig", async () => {
        const { queryByTestId } = renderComponent();

        await wait(() => {
          expect(queryByTestId("showUserData")).not.toBe(null);
        });

        expect(queryByTestId("loginPage")).toBe(null);
        expect(queryByTestId("profileData")).toBe(null);

        fireEvent.click(queryByTestId("showUserData"));
        await wait(() => {
          expect(queryByTestId("profileData")).not.toBe(null);
          expect(queryByTestId("loginPage")).not.toBe(null);

          expect(redirectHelper).toHaveBeenCalledTimes(1);
          expect(redirectHelper).toHaveBeenCalledWith(
            "/redirect-after-401?redirectTo=http://localhost/"
          );
        });
      });
    });

    describe("in case of 403 error", () => {
      beforeEach(async () => {
        nock(BASE_URL)
          .get("/api/v1/auth/current-user")
          .reply(403, { error: "some error message" });

        successfulSignIn();

        const ProfileData = () => {
          useQuery();

          return <div data-testid="profileData">Profile data</div>;
        };

        TestComponent = () => {
          const { isSignedIn } = useStoreState();
          const { mutation: signIn } = useMutation("signIn");
          const [showUserData, setShowUserData] = useState(false);

          const checkError = useCheckError();

          useEffect(() => {
            setUpCheckingError(checkError);

            signIn({ userData: { id: 1 } });
          }, []);

          return (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => setShowUserData(true)}
                  data-testid="showUserData"
                >
                  Show user data
                </button>
              ) : null}
              {showUserData ? <ProfileData /> : null}
            </>
          );
        };
      });

      it("removes session and redirects according to redirectConfig", async () => {
        const { queryByTestId } = renderComponent();

        await wait(() => {
          expect(queryByTestId("showUserData")).not.toBe(null);
        });

        expect(queryByTestId("loginPage")).toBe(null);
        expect(queryByTestId("profileData")).toBe(null);

        fireEvent.click(queryByTestId("showUserData"));

        await wait(() => {
          expect(queryByTestId("profileData")).not.toBe(null);
          expect(queryByTestId("showUserData")).not.toBe(null);

          expect(redirectHelper).toHaveBeenCalledTimes(1);
          expect(redirectHelper).toHaveBeenCalledWith("/redirect-after-403");
        });
      });
    });
  });
});
