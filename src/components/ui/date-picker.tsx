
"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { pl } from 'date-fns/locale'; // Keep Polish locale for formatting, as texts are hardcoded Polish
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  id?: string; // Added id prop for associating with Label
}

export function DatePicker({ date, onDateChange, className, id }: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const handleSelectDate = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setCalendarOpen(false);
  };

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id} // Apply the id to the button
          variant={"outline"}
          className={cn(
            "w-auto justify-start text-left font-normal px-3", // w-auto and reduced padding
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* Using Polish format directly as it was before i18n lib */}
          {date && isValid(date) ? format(date, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          initialFocus
          locale={pl} // Keep Polish locale for calendar display
        />
      </PopoverContent>
    </Popover>
  )
}

