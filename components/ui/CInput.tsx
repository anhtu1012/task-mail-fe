/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Input, InputProps, Space } from "antd";
import type { TextAreaProps } from "antd/lib/input";
import type { PasswordProps } from "antd/lib/input";
import type { SearchProps } from "antd/lib/input";

const { TextArea, Password, Search } = Input;

/* ------------------------------------------------------------------ */
/*  CInput                                                             */
/* ------------------------------------------------------------------ */
interface CInputProps extends InputProps {
  /** If true, applies mandatory/required field styling */
  mandatory?: boolean;
  /** If true, the input takes full width */
  full?: boolean;
  /** If true, the input will be converted to uppercase */
  uppercase?: boolean;
  /** If false, strips special characters and trims spaces (default: false) */
  allowSpecial?: boolean;
  /** Additional characters allowed even when allowSpecial is false */
  allowedChars?: string[];
}

const CInput = React.forwardRef<any, CInputProps>(
  (
    {
      mandatory = false,
      full = false,
      uppercase = false,
      allowSpecial = false,
      allowedChars = [],
      className = "",
      style,
      value,
      defaultValue,
      onChange,
      onBlur,
      addonBefore,
      addonAfter,
      ...restProps
    },
    ref,
  ) => {
    // ── "Tú → ú" Vietnamese IME bug — only reproduces on the customer's (slower) PC ──
    // Root cause: a CONTROLLED value race. On each keystroke onChange → Form re-render
    // → React re-applies `value` to input.value. On a slow machine the re-render is
    // delayed/batched out of step with typing, so a lagging value overwrites the DOM
    // mid-word and drops characters. A fast machine re-renders in time so it's hidden.
    //
    // Fix (same reason CInputLabel works): the DOM is driven by INTERNAL state that is
    // updated synchronously on every input event, so a stale parent value can never
    // overwrite what the user just typed. We sync FROM the parent only on genuine
    // external changes (form.setFieldsValue when selecting a ship, form.resetFields),
    // and never mid-composition. Heavy filtering runs on blur so typing is never
    // disturbed and diacritics are never stripped mid-word.
    const composingRef = React.useRef(false);
    const [innerValue, setInnerValue] = React.useState<string>(
      (value ?? defaultValue ?? "") as string,
    );

    React.useEffect(() => {
      if (value === undefined) return; // uncontrolled — internal state is the source
      if (composingRef.current) return; // never override the IME mid-composition
      const next = value === null ? "" : String(value); // null → ô rỗng, không hiện "null"
      setInnerValue((prev) => (prev === next ? prev : next));
    }, [value]);

    const applyTransform = (val: string): string => {
      val = val.normalize("NFC");
      if (uppercase) val = val.toUpperCase();
      if (!allowSpecial) {
        const escapedChars = allowedChars
          .map((c) => c.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&"))
          .join("");
        const regex = new RegExp(`[^\\p{L}\\p{M}\\p{N}\\s${escapedChars}]`, "gu");
        val = val.replace(regex, "").replace(/\s+/g, " ").replace(/^\s+/, "");
      }
      return val;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mirror the DOM synchronously — this is what makes the input immune to the
      // slow-machine re-render race.
      setInnerValue(e.target.value);
      // Don't churn the parent while composing; compositionEnd flushes the result.
      if (composingRef.current) return;
      onChange?.(e);
    };

    const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
      composingRef.current = true;
      (restProps as any).onCompositionStart?.(e);
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      composingRef.current = false;
      const val = (e.currentTarget as HTMLInputElement).value;
      setInnerValue(val);
      onChange?.(e as any); // flush final composed value (e.target.value === committed text)
      (restProps as any).onCompositionEnd?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const transformed = applyTransform(e.target.value);
      if (transformed !== e.target.value) {
        e.target.value = transformed;
        setInnerValue(transformed);
        onChange?.({ ...e, target: e.target } as any);
      }
      onBlur?.(e);
    };

    const hasAddon = addonBefore !== undefined || addonAfter !== undefined;

    const input = (
      <Input
        ref={ref}
        className={`c-input ${mandatory ? "c-input-mandatory" : ""} ${className}`.trim()}
        style={{
          width: full ? "100%" : undefined,
          textTransform: uppercase ? "uppercase" : undefined,
          ...style,
        }}
        {...restProps}
        value={innerValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
      />
    );

    if (!hasAddon) return input;

    return (
      <Space.Compact
        className="c-input-compact"
        style={{ width: full ? "100%" : undefined }}
      >
        {addonBefore !== undefined && (
          <span className="c-input-addon">{addonBefore}</span>
        )}
        {input}
        {addonAfter !== undefined && (
          <span className="c-input-addon">{addonAfter}</span>
        )}
      </Space.Compact>
    );
  },
);
CInput.displayName = "CInput";

/* ------------------------------------------------------------------ */
/*  CTextArea                                                          */
/* ------------------------------------------------------------------ */
interface CTextAreaProps extends TextAreaProps {
  mandatory?: boolean;
  full?: boolean;
}

const CTextArea = React.forwardRef<any, CTextAreaProps>(
  (
    { mandatory = false, full = false, className = "", style, ...restProps },
    ref,
  ) => {
    return (
      <TextArea
        ref={ref}
        className={`c-input c-textarea ${mandatory ? "c-input-mandatory" : ""} ${className}`.trim()}
        style={{ width: full ? "100%" : undefined, ...style }}
        {...restProps}
      />
    );
  },
);
CTextArea.displayName = "CTextArea";

/* ------------------------------------------------------------------ */
/*  CPassword                                                          */
/* ------------------------------------------------------------------ */
interface CPasswordProps extends PasswordProps {
  mandatory?: boolean;
  full?: boolean;
}

const CPassword = React.forwardRef<any, CPasswordProps>(
  (
    { mandatory = false, full = false, className = "", style, ...restProps },
    ref,
  ) => {
    return (
      <Password
        ref={ref}
        className={`c-input c-password ${mandatory ? "c-input-mandatory" : ""} ${className}`.trim()}
        style={{ width: full ? "100%" : undefined, ...style }}
        {...restProps}
      />
    );
  },
);
CPassword.displayName = "CPassword";

/* ------------------------------------------------------------------ */
/*  CSearch                                                            */
/* ------------------------------------------------------------------ */
interface CSearchProps extends SearchProps {
  mandatory?: boolean;
  full?: boolean;
}

const CSearch = React.forwardRef<any, CSearchProps>(
  (
    { mandatory = false, full = false, className = "", style, ...restProps },
    ref,
  ) => {
    return (
      <Search
        ref={ref}
        className={`c-input c-search ${mandatory ? "c-input-mandatory" : ""} ${className}`.trim()}
        style={{ width: full ? "100%" : undefined, ...style }}
        {...restProps}
      />
    );
  },
);
CSearch.displayName = "CSearch";

export default CInput;
export { CTextArea, CPassword, CSearch };
export type { CInputProps, CTextAreaProps, CPasswordProps, CSearchProps };
