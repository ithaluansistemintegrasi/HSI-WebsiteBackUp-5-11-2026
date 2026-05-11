import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getToken } from "./api";

const IDLE_TIMEOUT = 2 * 60 * 1000;

export default function useIdleLogout() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const clearExistingTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const logoutBecauseIdle = useCallback(() => {
    clearToken();
    navigate("/admin/login", {
      replace: true,
      state: { reason: "idle" },
    });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    const token = getToken();
    if (!token) return;

    clearExistingTimer();

    timerRef.current = setTimeout(() => {
      logoutBecauseIdle();
    }, IDLE_TIMEOUT);
  }, [logoutBecauseIdle]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      clearExistingTimer();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
}
