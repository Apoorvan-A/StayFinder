"use client";

import { addDays, startOfDay } from "date-fns";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import "react-day-picker/dist/style.css";

import type { BookedRange } from "@/types";
import { parseISODate } from "@/lib/format";

export type { DateRange };

export function DateRangePicker({
  range,
  onChange,
  bookedRanges = [],
  numberOfMonths = 2,
}: {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  bookedRanges?: BookedRange[];
  numberOfMonths?: number;
}) {
  const today = startOfDay(new Date());

  // Booked intervals are half-open: the checkout day itself is free to start a new stay,
  // so the disabled block runs [check_in, check_out - 1 day].
  const disabled: Matcher[] = [
    { before: today },
    ...bookedRanges.map((b) => ({
      from: parseISODate(b.check_in),
      to: addDays(parseISODate(b.check_out), -1),
    })),
  ];

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={onChange}
      numberOfMonths={numberOfMonths}
      disabled={disabled}
      fromDate={today}
    />
  );
}
