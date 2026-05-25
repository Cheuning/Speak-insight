import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useJournal } from "../hooks/useJournal";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";

export function CalendarView() {
  const { records, deleteRecord } = useJournal();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof records>();
    records.forEach(r => {
      const existing = map.get(r.date) || [];
      map.set(r.date, [...existing, r]);
    });
    return map;
  }, [records]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedRecords = recordsByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EAE5DA]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-[#F7F2EB] rounded-full text-[#8C877E]">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-[#5C574F] font-bold text-lg font-sans">
            {format(currentDate, "yyyy년 MM월")}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-[#F7F2EB] rounded-full text-[#8C877E]">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[#A39E93] text-xs font-sans">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasRecords = recordsByDate.has(dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-xl transition-all h-14
                  ${!isCurrentMonth ? "text-[#D5CFC3]" : "text-[#5C574F]"}
                  ${isSelected ? "bg-[#8A6D52] text-white shadow-md" : "hover:bg-[#F7F2EB]"}
                `}
              >
                <span className={`text-sm font-sans ${isSelected ? "text-white" : ""}`}>
                  {format(day, "d")}
                </span>
                {hasRecords && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-[#EAE5DA]" : "bg-[#8A6D52]"}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Records */}
      <div className="space-y-4 pt-4 border-t border-[#EAE5DA]/50">
        <h3 className="text-[#8C877E] text-sm font-sans">
          {format(selectedDate, "M월 d일")}의 기록
        </h3>

        {selectedRecords.length === 0 ? (
          <div className="text-center py-8 text-[#B5B0A6] font-sans text-sm">
            이 날은 기록이 없어요.
          </div>
        ) : (
          selectedRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#EAE5DA] relative group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-[#3D3B38] font-sans">{record.title}</h4>
                <button 
                  onClick={() => deleteRecord(record.id)}
                  className="text-[#D5CFC3] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-[#5C574F] whitespace-pre-wrap leading-relaxed font-sans">{record.transcript}</p>
              <div className="mt-3 text-xs text-[#A39E93] font-sans">
                {new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "numeric" }).format(new Date(record.createdAt))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
