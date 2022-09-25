import { useEffect } from "react";

const useEventHandler = (object: H.util.EventTarget, type: string, handler: (evt: H.mapevents.Event) => void) => {
  useEffect(() => {
    if (object && handler) {
      object.addEventListener(type, handler as any);
      return () => {
        object.removeEventListener(type, handler as any);
      };
    }
  }, [object, handler]);
};

export interface EventHandlers {
  onPointerMove?: (evt: H.mapevents.Event) => void;
  onPointerLeave?: (evt: H.mapevents.Event) => void;
  onPointerEnter?: (evt: H.mapevents.Event) => void;
  onDragStart?: (evt: H.mapevents.Event) => void;
  onDrag?: (evt: H.mapevents.Event) => void;
  onDragEnd?: (evt: H.mapevents.Event) => void;
  onTap?: (evt: H.mapevents.Event) => void;
}

export const useEventHandlers = (object: H.util.EventTarget, {
  onTap,
  onPointerLeave,
  onPointerMove,
  onPointerEnter,
  onDragStart,
  onDrag,
  onDragEnd,
}: EventHandlers): void => {
  useEventHandler(object, "tap", onTap);
  useEventHandler(object, "pointerleave", onPointerLeave);
  useEventHandler(object, "pointermove", onPointerMove);
  useEventHandler(object, "pointerenter", onPointerEnter);
  useEventHandler(object, "dragstart", onDragStart);
  useEventHandler(object, "drag", onDrag);
  useEventHandler(object, "dragend", onDragEnd);
};
