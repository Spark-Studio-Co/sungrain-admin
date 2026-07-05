import { describe, expect, it } from "vitest";
import {
  buildApiErrorToastDetail,
  getApiErrorMessage,
} from "./api-error-toast";

describe("api error toast helpers", () => {
  it("turns known backend messages into human readable Russian copy", () => {
    const error = {
      response: {
        status: 400,
        data: { message: "Email already exists", error: "Bad Request" },
      },
    };

    expect(buildApiErrorToastDetail(error)).toEqual({
      title: "Проверьте данные",
      description: "Пользователь с таким email уже существует.",
      status: 400,
    });
  });

  it("joins backend validation arrays without leaking raw English", () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: [
            "email must be an email",
            "Password must be at least 6 characters",
          ],
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe(
      "Некорректный email. Пароль должен быть не короче 6 символов."
    );
  });

  it("uses a network fallback when backend did not respond", () => {
    expect(getApiErrorMessage({ request: {}, message: "Network Error" })).toBe(
      "Нет связи с backend. Проверьте интернет или сервер."
    );
  });
});
