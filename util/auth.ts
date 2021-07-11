import { bcrypt } from "../deps.ts";

export const authorizationMatches = (
  passedAuthorization: string,
  existingAuthorization: string
) => {
  if (bcrypt.compareSync(passedAuthorization, existingAuthorization))
    return true;

  if (passedAuthorization.startsWith("Basic ")) {
    const withoutUsername =
      "Basic " +
      btoa(atob(passedAuthorization.split(" ")[1]).replace(/[^:]*:/, ":"));

    if (
      withoutUsername !== passedAuthorization &&
      bcrypt.compareSync(withoutUsername, existingAuthorization)
    )
      return true;
  }

  return false;
};
