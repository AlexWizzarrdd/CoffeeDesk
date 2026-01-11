import React, { useEffect, useRef, type RefObject } from "react";
import { NavLink, useNavigate } from "react-router";
import CalendarIcon from "@/assets/icons/calendarLogo.svg?react";
import ProfileIcon from "@/assets/icons/profileLogo.svg?react";
import { clearTokens } from "@/api/tokenApi";
import { useAuthContext } from "@/hooks/authHooks";
import { NotificationsBell } from "@/components/Notifications/NotificationsBell";
import { TasksBell } from "@/components/TasksBell/TasksBell";

const updateMaskPosition = (
  maskRef: RefObject<SVGCircleElement | null>,
  params?: { cx: number; cy: number; r: number }
) => {
  if (!maskRef.current || !params) return;
  const { cx, cy, r } = params;
  maskRef.current.setAttribute("cx", String(cx));
  maskRef.current.setAttribute("cy", String(cy));
  maskRef.current.setAttribute("r", String(r));
  maskRef.current.setAttribute("fill", "black");
};

const calculateMaskParams = (
  wrapperElement: HTMLDivElement | null,
  maskRef: RefObject<SVGCircleElement | null>
) => {
  if (!wrapperElement || !maskRef.current) return;

  const wrapper = wrapperElement.getBoundingClientRect();
  const mask = maskRef.current.ownerSVGElement?.getBoundingClientRect();
  if (!mask) return;

  let wrapperLeft = wrapper.left + wrapper.width / 2;
  if (wrapperElement.querySelector(".active")) {
    wrapperLeft = wrapper.left;
  }

  const cx = wrapperLeft - mask.left + wrapper.width / 2;
  const cy = wrapper.top - mask.top + wrapper.height / 2;
  const r = (Math.max(wrapper.width, wrapper.height) / 2) * 1.25;

  return { cx, cy, r };
};

const linkHandler = (
  ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
  circleRef: RefObject<SVGCircleElement | null>
) => {
  if (ev.target === ev.currentTarget) return;

  const el = ev.currentTarget; // HTMLDivElement
  if (el.querySelector(".active")) return;

  circleRef.current?.setAttribute("cx", "90");
  circleRef.current?.setAttribute("fill", "white");

  const maskParams = calculateMaskParams(el, circleRef);
  setTimeout(() => updateMaskPosition(circleRef, maskParams), 350);
};

export const Sidebar = () => {
  const circleRef = useRef<SVGCircleElement>(null);
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const isManagerLike = user.role === "manager" || user.role === "admin";

  useEffect(() => {
    const active = document.querySelector(".active");
    const wrapper = (active?.parentElement as HTMLDivElement | null) ?? null;
    if (!wrapper) return;

    const params = calculateMaskParams(wrapper, circleRef);
    updateMaskPosition(circleRef, params);
  }, []);

  return (
    <div className="nav-wrapper">
      <div className="nav-helper">
        <svg className="nav-mask">
          <defs>
            <mask id="circle-mask">
              <rect width="147" height="100vh" fill="white" />
              {window.innerWidth < 1026 ? null : (
                <circle ref={circleRef} r="90" fill="white" className="nav-mask-circle" />
              )}
            </mask>
          </defs>
        </svg>
      </div>

      <nav className="nav">
        <div className="nav-link-wrapper" onMouseDown={(ev) => linkHandler(ev, circleRef)}>
          <NavLink to="/">
            <ProfileIcon />
          </NavLink>
        </div>

        <div className="nav-link-wrapper" onMouseDown={(ev) => linkHandler(ev, circleRef)}>
          <NavLink to="/calendar">
            <CalendarIcon />
          </NavLink>
        </div>

        <div className="nav-link-wrapper" onMouseDown={(ev) => linkHandler(ev, circleRef)}>
          <NavLink to="/notifications">
            <NotificationsBell />
          </NavLink>
        </div>

          {/* tasks */}
        <div className="nav-link-wrapper" onMouseDown={(ev) => linkHandler(ev, circleRef)}>
            <TasksBell pollMs={3000} />
        </div>

        {isManagerLike && (
          <div className="nav-link-wrapper" onMouseDown={(ev) => linkHandler(ev, circleRef)}>
            <NavLink to="/users">
              <ProfileIcon />
            </NavLink>
          </div>
        )}
      </nav>

      <button
        className="button button-exit"
        onClick={() => {
          clearTokens();
          navigate("/auth");
        }}
      >
        Выйти
      </button>
    </div>
  );
};