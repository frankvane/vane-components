import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { __NAME__CoreProps, __NAME__CoreRef } from "./plugins/types";

/**
 * __TITLE__核心组件。
 * 铁律：核心只做"渲染 + 转发生命周期"，所有可变需求都交给插件。
 * 这样核心才能长期稳定，插件才能无限扩展。
 */
export const __NAME__Core = forwardRef<__NAME__CoreRef, __NAME__CoreProps>(
  (props, ref) => {
    const {
      items,
      renderItem,
      containerClassName,
      containerStyle,
      onMount,
      onUnmount,
      debug,
      containerRefExternal,
    } = props;

    const localRef = useRef<HTMLDivElement | null>(null);
    const containerRef = containerRefExternal ?? localRef;
    const [, setTick] = useState(0);

    useImperativeHandle<__NAME__CoreRef>(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate: () => setTick((t) => t + 1),
        getSize: () => ({
          width: containerRef.current?.offsetWidth ?? 0,
          height: containerRef.current?.offsetHeight ?? 0,
        }),
      }),
      []
    );

    useEffect(() => {
      if (debug) console.debug("[__NAME__Core] mounted");
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={containerRef}
        className={containerClassName}
        style={{ position: "relative", ...containerStyle }}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id ?? index}>{renderItem(item, index)}</React.Fragment>
        ))}
      </div>
    );
  }
);

__NAME__Core.displayName = "__NAME__Core";
