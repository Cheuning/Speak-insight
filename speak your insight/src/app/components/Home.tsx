import { useState, useRef, useEffect } from "react";
import { Mic, Square, Save, Trash2 } from "lucide-react";
import { useJournal, JournalRecord } from "../hooks/useJournal";

export function Home() {
  const { records, saveRecord, deleteRecord } = useJournal();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + final + interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setIsSupported(false);
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          // Restart if it stopped unexpectedly but we are still recording
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setIsRecording(true);
      setTranscript("");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch(e) {
          console.error(e);
        }
      }
    }
  };

  const handleSave = () => {
    if (!transcript.trim()) return;
    
    const now = new Date();
    const newRecord: JournalRecord = {
      id: crypto.randomUUID(),
      title: title || '오늘의 생각',
      transcript: transcript,
      date: now.toISOString().split('T')[0],
      createdAt: now.getTime(),
    };
    
    saveRecord(newRecord);
    setTranscript("");
    setTitle("");
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysRecords = records.filter(r => r.date === today);

  const displayDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* Date Header */}
      <div className="text-center pb-4 border-b border-[#EAE5DA]">
        <h2 className="text-[#8A6D52] text-lg font-bold">{displayDate}</h2>
      </div>

      {/* Recording Area */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE5DA]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[#5C574F] font-bold text-lg">새로운 기록</h3>
          {isRecording && (
            <span className="flex items-center text-xs text-red-500 font-sans">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
              기록 중...
            </span>
          )}
        </div>

        {!isSupported && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm font-sans">
            음성 인식이 지원되지 않는 환경입니다. 직접 텍스트를 입력해 주세요.
          </div>
        )}

        <input
          type="text"
          placeholder="제목 (선택사항)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 px-0 py-2 border-b border-[#EAE5DA] bg-transparent text-[#3D3B38] placeholder-[#B5B0A6] focus:outline-none focus:border-[#8A6D52] transition-colors font-bold font-sans"
        />

        <textarea
          placeholder="오늘 어떤 영감이 떠올랐나요?"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full h-32 bg-transparent text-[#3D3B38] placeholder-[#B5B0A6] resize-none focus:outline-none leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F0ECE1]">
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? "bg-red-50 text-red-500 shadow-inner" 
                : "bg-[#F7F2EB] text-[#8A6D52] hover:bg-[#EAE4DB]"
            }`}
          >
            {isRecording ? <Square fill="currentColor" size={20} /> : <Mic size={24} />}
          </button>

          <button
            onClick={handleSave}
            disabled={!transcript.trim()}
            className="px-6 py-2.5 bg-[#8A6D52] text-white rounded-full font-sans text-sm hover:bg-[#735A43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
          >
            <Save size={16} />
            다이어리에 끼우기
          </button>
        </div>
      </div>

      {/* Today's Records List */}
      <div className="space-y-4">
        <h3 className="text-[#8C877E] text-sm font-sans">오늘의 기록들</h3>
        
        {todaysRecords.length === 0 ? (
          <div className="text-center py-10 text-[#B5B0A6] font-sans text-sm bg-white/50 rounded-2xl border border-dashed border-[#EAE5DA]">
            아직 기록이 없어요. 첫 번째 영감을 남겨보세요.
          </div>
        ) : (
          todaysRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#EAE5DA] relative group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-[#3D3B38]">{record.title}</h4>
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
