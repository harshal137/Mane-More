import { userRequest } from "../requestMethods";
import { loginFailure, loginStart, loginSuccess } from "./userRedux"

/** Authenticates a user and updates the Redux authentication state. */
export const login = async (dispatch, user) =>{

    dispatch(loginStart());

    try {
        const res = await userRequest.post("/auth/login/", user);
        if (res.data?.role !== "user") {
            dispatch(loginFailure());
            throw new Error("Please use the admin login page for this account");
        }
        dispatch(loginSuccess(res.data));
        return res.data;
    } catch (error) {
        dispatch(loginFailure())
        throw error;
    }
}
