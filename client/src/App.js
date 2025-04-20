// survey-app/client/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
// Import routing components
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Hardcoded Comparison Data ---
// Data should represent plausible distributions for each question. Percentages should roughly add up to 100.
const comparisonStats = {
  // Q1: Age
  0: [
    { name: "ต่ำกว่า 15", value: 5 },
    { name: "15-18", value: 35 },
    { name: "19-22", value: 40 },
    { name: "23-26", value: 15 },
    { name: "มากกว่า 26", value: 5 }
  ],
  // Q2: Gender
  1: [
    { name: "หญิง", value: 52 },
    { name: "ชาย", value: 40 },
    { name: "ไม่ตรงกับเพศกำเนิด", value: 3 },
    { name: "อยากให้เรียกว่าอย่างอื่น", value: 2 },
    { name: "ไม่ขอตอบ", value: 3 }
  ],
  // Q3: Age of First Sex
  2: [
    { name: "ยังไม่เคยเลย", value: 25 },
    { name: "ต่ำกว่า 15", value: 8 },
    { name: "15-18", value: 45 },
    { name: "18-24", value: 20 },
    { name: "มากกว่า 24", value: 2 }
  ],
  // Q4: First Partner Type
  3: [
    { name: "แฟน", value: 60 },
    { name: "เพื่อน", value: 5 },
    { name: "คู่สมรส", value: 3 },
    { name: "One night stand", value: 7 },
    { name: "ยังไม่เคยมีจ้า", value: 25 } // Should match Q3's 'ยังไม่เคยเลย'
  ],
  // Q5: Number of Partners
  4: [
    { name: "0 (ยังเวอร์จิ้นอยู่)", value: 25 }, // Should match Q3/Q4
    { name: "1 คน", value: 30 },
    { name: "2-5 คน", value: 30 },
    { name: "6-10 คน", value: 10 },
    { name: "มากกว่า 10 คน", value: 5 }
  ],
  // Q6: Frequency of Sex
  5: [
    { name: "สัปดาห์ละหลายรอบเลยจ้า", value: 15 },
    { name: "เดือนละครั้งก็ยังดี", value: 25 },
    { name: "แล้วแต่อารมณ์/โอกาส", value: 40 },
    { name: "ไม่มีเลยช่วงนี้", value: 20 } // Includes those never had sex + inactive
  ],
  // Q7: Last Time Sex
  6: [
    { name: "วันนี้เลย สดๆ ร้อนๆ", value: 5 },
    { name: "ไม่กี่วันก่อน", value: 15 },
    { name: "ภายในเดือนนี้", value: 20 },
    { name: "1-3 เดือนที่แล้ว", value: 15 },
    { name: "มากกว่า 3 เดือน", value: 10 },
    { name: "1-2 ปีที่แล้ว", value: 5 },
    { name: "นานจนลืม", value: 5 },
    { name: "ยังไม่เคยเลย", value: 25 } // Should match Q3/Q4/Q5
  ],
  // Q8: Contraception Methods Used (Multiple Choice - percentages reflect % of *respondents* who selected this, not exclusive choices)
  7: [
    { name: "ยาคุมแบบแผง", value: 30 },
    { name: "ยาคุมฉุกเฉิน", value: 25 },
    { name: "ยาคุมแบบฝัง", value: 5 },
    { name: "แผ่นแปะคุมกำเนิด", value: 2 },
    { name: "ถุงยางอนามัย", value: 75 },
    { name: "หลั่งนอก", value: 40 },
    { name: "ไม่ได้ป้องกันเลย", value: 15 } // % of people who *sometimes* don't protect
  ],
  // Q9: Unprotected Sex Experience
  8: [
    { name: "เคย แล้วรู้สึกผิด/กังวล", value: 35 },
    { name: "เคย แต่รู้สึกเฉยๆ", value: 20 },
    { name: "ไม่เคยเลย", value: 20 }, // Used protection always
    { name: "ยังไม่เคยมีเซ็กซ์", value: 25 } // Match Q3/Q4/Q5/Q7
  ],
  // Q10: Reasons for No Contraception
  9: [
    { name: "ลืม", value: 20 },
    { name: "ไม่ได้เตรียมไว้", value: 25 },
    { name: "ขี้เกียจ / ไม่ชอบความรู้สึก", value: 15 },
    { name: "อีกฝ่ายไม่อยากใช้", value: 10 },
    { name: "คิดว่าไม่เสี่ยง", value: 18 },
    { name: "ไม่รู้วิธี", value: 5 },
    { name: "ไม่มีเหตุผลเลย", value: 7 } // Note: These apply to those who *have* had unprotected sex
  ],
  // Q11: Knowledge of Methods
  10: [
    { name: "แค่ถุงยางกับยาคุมแหละ", value: 40 },
    { name: "ประมาณ 3-4 แบบ", value: 35 },
    { name: "หลายแบบเลย จำไม่หมด", value: 15 },
    { name: "ไม่แน่ใจเลย ไม่ค่อยรู้เรื่องพวกนี้", value: 10 }
  ],
  // Q12: Decision Maker for Contraception
  11: [
    { name: "เราเป็นคนเลือก", value: 30 },
    { name: "อีกฝ่ายเป็นคนเลือก", value: 10 },
    { name: "คุยกันแล้วตัดสินใจร่วมกัน", value: 50 },
    { name: "ไม่เคยคุยกันเรื่องนี้เลย", value: 10 } // Includes those not active/never had sex
  ],
  // Q13: Feeling about Condoms
  12: [
    { name: "จำเป็น ใช้เสมอ", value: 45 },
    { name: "ใช้บ้าง ไม่ใช้บ้าง", value: 30 },
    { name: "ไม่ชอบเลย รู้สึกขัดอารมณ์", value: 15 },
    { name: "ไม่เคยใช้ / ไม่รู้จะเริ่มยังไง", value: 10 } // Includes never had sex
  ],
  // Q14: Friend's Unplanned Pregnancy
  13: [
    { name: "ช่วยคิด ช่วยหาทางออก", value: 40 },
    { name: "อยู่ข้างๆ ให้กำลังใจ", value: 35 },
    { name: "แนะนำให้ไปพบแพทย์", value: 20 },
    { name: "เงียบไว้ ไม่อยากยุ่ง", value: 5 }
  ]
};

// --- Questions Data (moved outside component for clarity) ---
const questions = [
    { id: 1, category: "ข้อมูลพื้นฐาน", question: "อายุเท่าไหร่แล้วเนี่ย?", options: ["ต่ำกว่า 15", "15-18", "19-22", "23-26", "มากกว่า 26"] },
    { id: 2, category: "ข้อมูลพื้นฐาน", question: "เพศของคุณคืออะไร?", options: ["หญิง", "ชาย", "ไม่ตรงกับเพศกำเนิด", "อยากให้เรียกว่าอย่างอื่น", "ไม่ขอตอบ"] },
    { id: 3, category: "ประสบการณ์ทางเพศ", question: "เริ่มมีเซ็กซ์ครั้งแรกตอนอายุเท่าไหร่?", options: ["ยังไม่เคยเลย", "ต่ำกว่า 15", "15-18", "18-24", "มากกว่า 24"] },
    { id: 4, category: "ประสบการณ์ทางเพศ", question: "แล้วครั้งแรกของคุณ...เกิดขึ้นกับใคร?", options: ["แฟน", "เพื่อน", "คู่สมรส", "One night stand", "ยังไม่เคยมีจ้า"] },
    { id: 5, category: "ประสบการณ์ทางเพศ", question: "จนถึงตอนนี้...มีคู่นอนมากี่คนแล้ว?", options: ["0 (ยังเวอร์จิ้นอยู่)", "1 คน", "2-5 คน", "6-10 คน", "มากกว่า 10 คน"] },
    { id: 6, category: "ประสบการณ์ทางเพศ", question: "ช่วงนี้มีเซ็กซ์บ่อยแค่ไหนอะ?", options: ["สัปดาห์ละหลายรอบเลยจ้า", "เดือนละครั้งก็ยังดี", "แล้วแต่อารมณ์/โอกาส", "ไม่มีเลยช่วงนี้"] },
    { id: 7, category: "ประสบการณ์ทางเพศ", question: "ครั้งล่าสุดที่มีเซ็กซ์คือเมื่อไหร่กันน้า?", options: ["วันนี้เลย สดๆ ร้อนๆ", "ไม่กี่วันก่อน", "ภายในเดือนนี้", "1-3 เดือนที่แล้ว", "มากกว่า 3 เดือน", "1-2 ปีที่แล้ว", "นานจนลืม", "ยังไม่เคยเลย"] },
    { id: 8, category: "พฤติกรรมการคุมกำเนิด", question: "ที่ผ่านมาเคยป้องกันการตั้งครรภ์ยังไงบ้าง?", options: ["ยาคุมแบบแผง", "ยาคุมฉุกเฉิน", "ยาคุมแบบฝัง", "แผ่นแปะคุมกำเนิด", "ถุงยางอนามัย", "หลั่งนอก", "ไม่ได้ป้องกันเลย"], multipleChoice: true },
    { id: 9, category: "พฤติกรรมการคุมกำเนิด", question: "เคยมีเซ็กซ์แบบไม่ได้ป้องกันมั้ย? แล้วรู้สึกยังไงหลังจากนั้น?", options: ["เคย แล้วรู้สึกผิด/กังวล", "เคย แต่รู้สึกเฉยๆ", "ไม่เคยเลย", "ยังไม่เคยมีเซ็กซ์"] },
    { id: 10, category: "พฤติกรรมการคุมกำเนิด", question: "อะไรคือเหตุผลที่คุณไม่คุมกำเนิดในบางครั้ง?", options: ["ลืม", "ไม่ได้เตรียมไว้", "ขี้เกียจ / ไม่ชอบความรู้สึก", "อีกฝ่ายไม่อยากใช้", "คิดว่าไม่เสี่ยง", "ไม่รู้วิธี", "ไม่มีเหตุผลเลย"] },
    { id: 11, category: "ความรู้และทัศนคติ", question: "คุณรู้จักวิธีคุมกำเนิดทั้งหมดกี่แบบ?", options: ["แค่ถุงยางกับยาคุมแหละ", "ประมาณ 3-4 แบบ", "หลายแบบเลย จำไม่หมด", "ไม่แน่ใจเลย ไม่ค่อยรู้เรื่องพวกนี้"] },
    { id: 12, category: "ความรู้และทัศนคติ", question: "ปกติใครเป็นคนตัดสินใจเรื่องการคุมกำเนิด?", options: ["เราเป็นคนเลือก", "อีกฝ่ายเป็นคนเลือก", "คุยกันแล้วตัดสินใจร่วมกัน", "ไม่เคยคุยกันเรื่องนี้เลย"] },
    { id: 13, category: "ความรู้และทัศนคติ", question: "คุณรู้สึกยังไงกับการใช้ถุงยาง?", options: ["จำเป็น ใช้เสมอ", "ใช้บ้าง ไม่ใช้บ้าง", "ไม่ชอบเลย รู้สึกขัดอารมณ์", "ไม่เคยใช้ / ไม่รู้จะเริ่มยังไง"] },
    { id: 14, category: "สถานการณ์สมมุติ", question: "ถ้าเพื่อนท้องไม่พร้อม คุณจะ…", options: ["ช่วยคิด ช่วยหาทางออก", "อยู่ข้างๆ ให้กำลังใจ", "แนะนำให้ไปพบแพทย์", "เงียบไว้ ไม่อยากยุ่ง"] }
];

// Colors for the comparison chart bars
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8dd1e1'];

// --- Main Survey Component ---
// This component now receives the suffix from the router
const SurveyComponent = () => {
    // Get the suffix from the URL parameter
    const { suffix } = useParams(); // e.g., if URL is /campaignX, suffix will be "campaignX"

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [completed, setCompleted] = useState(false);
    const [started, setStarted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const submitAnswers = useCallback(async (finalAnswers) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        console.log("Submitting answers:", finalAnswers, "Suffix:", suffix); // Log suffix

        try {
            const response = await fetch('/api/submit', { // Relative path for API call
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send answers AND the suffix
                body: JSON.stringify({ answers: finalAnswers, sourceSuffix: suffix || null }), // Send null if suffix is undefined
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            console.log("Submission successful:", result);
            setCompleted(true);

        } catch (err) {
            console.error("Submission failed:", err);
            setError(`การส่งข้อมูลล้มเหลว: ${err.message}. กรุณาลองอีกครั้ง.`);
            setCompleted(true); // Still go to completed screen to show the error
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, answers, suffix]); // Added answers and suffix dependencies

    // --- handleAnswer, handleMultipleChoice, confirmMultipleChoice, nextQuestion, startSurvey ---
    const handleAnswer = (option) => {
        const newAnswers = { ...answers, [currentQuestionIndex]: option };
        setAnswers(newAnswers);
        const dataForChart = comparisonStats[currentQuestionIndex] || [];
        setComparisonData(dataForChart);
        setShowComparison(true);
    };

    const handleMultipleChoice = (option) => {
        const currentSelection = answers[currentQuestionIndex] || [];
        let updatedSelection;
        if (currentSelection.includes(option)) {
            updatedSelection = currentSelection.filter(item => item !== option);
        } else {
            updatedSelection = [...currentSelection, option];
        }
        setAnswers({ ...answers, [currentQuestionIndex]: updatedSelection });
    };

     const confirmMultipleChoice = () => {
         const currentSelection = answers[currentQuestionIndex] || [];
         if (currentSelection.length === 0) {
             alert("กรุณาเลือกอย่างน้อยหนึ่งตัวเลือก");
             return;
         }
         const dataForChart = comparisonStats[currentQuestionIndex] || [];
         setComparisonData(dataForChart);
         setShowComparison(true);
    };

    const nextQuestion = () => {
        setShowComparison(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            submitAnswers(answers); // Submit on the last question
        }
    };

    const startSurvey = () => {
        setStarted(true);
    };


    // --- progressPercentage calculation ---
    const progressPercentage = started ? ((currentQuestionIndex) / questions.length) * 100 : 0;

    // --- Render Logic ---

    // Start Screen JSX
    if (!started) {
       return (
           <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-100 to-pink-100 font-sans">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
                    <h1 className="text-2xl font-bold text-purple-700 mb-4">ChulaHealthSurvey</h1>
                    <h2 className="text-lg font-semibold mb-6 text-gray-700">จากอินไซต์สู่แคมเปญ: วิเคราะห์ข้อมูลพฤติกรรมทางเพศและการคุมกำเนิดของวัยรุ่นไทย</h2>

                    <div className="mb-6 flex justify-center">
                        <div className="bg-purple-100 rounded-full px-4 py-2 text-purple-800 font-medium text-sm shadow-sm">
                            100+ คนได้ร่วมตอบแบบสอบถามนี้แล้ว
                        </div>
                    </div>

                    <p className="mb-6 text-gray-600 text-sm">
                        แบบสอบถามนี้จะช่วยให้เราเข้าใจพฤติกรรมและทัศนคติเกี่ยวกับเรื่องเพศและการคุมกำเนิดของวัยรุ่นไทยได้ดีขึ้น เพื่อนำไปพัฒนาแคมเปญการสื่อสารเชิงรุกต่อไป
                    </p>

                    <div className="flex flex-col gap-4 mb-6 text-left">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
                            <span className="ml-3 text-gray-700 text-sm">ใช้เวลาเพียง 3-5 นาที</span>
                        </div>
                        <div className="flex items-center">
                             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
                             <span className="ml-3 text-gray-700 text-sm">ข้อมูลทั้งหมด <span className="font-semibold">ไม่ระบุตัวตน</span> และถูกเก็บเป็นความลับ</span>
                        </div>
                        <div className="flex items-center">
                             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
                            <span className="ml-3 text-gray-700 text-sm">เปรียบเทียบคำตอบของคุณกับคนอื่นๆ (โดยไม่ระบุตัวตน)</span>
                        </div>
                    </div>

                    <button
                        onClick={startSurvey}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
                    >
                        เริ่มทำแบบสอบถาม
                    </button>
                </div>
           </div>
       );
    }

    // Completion Screen JSX
     if (completed) {
        // Note: Question indices are 0-based. Q13 is at index 12.
        const summaryHighlights = [
            `คุณตอบคำถามทั้งหมด ${Object.keys(answers).length} ข้อ`,
            answers[0] ? `ช่วงอายุของคุณ: ${answers[0]}` : "ไม่ได้ระบุอายุ",
            answers[12] === "จำเป็น ใช้เสมอ" ? "คุณให้ความสำคัญกับการใช้ถุงยาง 👍" : "อย่าลืมป้องกันเมื่อมีเพศสัมพันธ์นะ",
        ].filter(Boolean); // Filter out nulls just in case

        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-100 to-pink-100 font-sans">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-center text-purple-700 mb-2">ขอบคุณที่ร่วมตอบแบบสอบถาม!</h1>
                    <p className="text-center text-gray-600 mb-6 text-sm">คำตอบของคุณมีส่วนช่วยในการพัฒนาแคมเปญสุขภาพทางเพศสำหรับวัยรุ่นไทย</p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                            <strong className="font-bold">เกิดข้อผิดพลาด:</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    {!error && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                            <strong className="font-bold">สำเร็จ!</strong>
                            <span className="block sm:inline"> ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว</span>
                        </div>
                    )}

                    <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-2 text-md">สรุปคร่าวๆ:</h3>
                        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                           {summaryHighlights.map((item, index) => <li key={index}>{item}</li>)}
                           {/* Optionally display the source suffix if it exists */}
                           {suffix && <li className="mt-2 text-xs text-gray-500">Source Reference: {suffix}</li>}
                        </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-2 text-md">สิ่งที่คุณควรรู้:</h3>
                        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                            <li>การมีเพศสัมพันธ์ที่ปลอดภัยคือการใช้ถุงยางอนามัย <span className="font-semibold">ทุกครั้ง</span> เพื่อป้องกันทั้งการตั้งครรภ์และโรคติดต่อทางเพศสัมพันธ์</li>
                            <li>ยาคุมกำเนิดมีหลายชนิด (ยาเม็ด, ยาฝัง, ยาฉีด) ช่วยป้องกันการตั้งครรภ์ได้ดี แต่ <span className="font-semibold">ไม่ป้องกันโรค</span></li>
                            <li><span className="font-semibold">การสื่อสาร</span> กับคู่นอนเรื่องการป้องกันเป็นสิ่งสำคัญมาก</li>
                            <li>ต้องการคำปรึกษา? คุยกับผู้เชี่ยวชาญหรือคลินิกสุขภาพใกล้บ้านได้</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Placeholder buttons - Add functionality if needed */}
                        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full transition duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                            แชร์ผลลัพธ์ (เร็วๆ นี้)
                        </button>
                        <button className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 font-bold py-3 rounded-full transition duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                            เรียนรู้เพิ่มเติม (เร็วๆ นี้)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Question Display JSX
    const currentQuestion = questions[currentQuestionIndex];
    const isMultipleChoice = currentQuestion.multipleChoice;
    const selectedOptions = answers[currentQuestionIndex] || (isMultipleChoice ? [] : null);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-100 to-pink-100 font-sans">
           <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2.5 rounded-t-xl">
                    <div
                        className="bg-purple-600 h-2.5 rounded-tl-xl transition-width duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                {/* Question section */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                         <div className="bg-purple-100 rounded-full px-3 py-1 text-xs text-purple-800 font-medium inline-block shadow-sm">
                             {currentQuestion.category}
                         </div>
                         <div className="text-xs text-gray-500 font-medium">
                            คำถาม {currentQuestionIndex + 1} / {questions.length}
                         </div>
                    </div>


                    <h2 className="text-xl font-semibold mb-6 text-gray-800">
                        {currentQuestion.question}
                        {isMultipleChoice && <span className="text-sm font-normal text-gray-500 ml-2">(เลือกได้หลายตัวเลือก)</span>}
                    </h2>

                    {!showComparison ? (
                        // --- Options ---
                        <div className="flex flex-col gap-3">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => isMultipleChoice ? handleMultipleChoice(option) : handleAnswer(option)}
                                    className={`p-3 rounded-lg text-left transition duration-200 border ${
                                        isMultipleChoice
                                            ? selectedOptions.includes(option)
                                                ? "bg-purple-600 text-white border-purple-700 font-medium shadow-md" // Selected multi-choice
                                                : "bg-gray-50 hover:bg-purple-100 text-gray-800 border-gray-200 hover:border-purple-300" // Not selected multi-choice
                                            : "bg-gray-50 hover:bg-purple-100 text-gray-800 border-gray-200 hover:border-purple-300" // Single choice
                                    } focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 text-sm`}
                                >
                                    {option}
                                </button>
                            ))}

                            {/* Show "ตกลง" button only for multiple choice after at least one selection */}
                            {isMultipleChoice && (
                                <button
                                    onClick={confirmMultipleChoice}
                                    disabled={(selectedOptions || []).length === 0} // Disable if nothing selected
                                    className={`mt-4 w-full font-bold py-3 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 text-sm ${
                                        (selectedOptions || []).length > 0
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    ตกลง
                                </button>
                            )}
                        </div>
                    ) : (
                        // --- Comparison Chart ---
                        <div>
                            <h3 className="font-semibold mb-1 text-md text-gray-700">คำตอบของคุณ:</h3>
                             <p className="bg-purple-100 text-purple-800 rounded-md p-2 mb-4 text-sm font-medium inline-block">
                                {Array.isArray(selectedOptions) ? selectedOptions.join(', ') : selectedOptions}
                             </p>

                            <h3 className="font-semibold mb-4 text-md text-gray-700">เทียบกับคำตอบของผู้อื่น (%):</h3>

                            <div className="h-64 mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis type="number" hide /> {/* Hide X axis labels for vertical */}
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} interval={0} axisLine={false} tickLine={false} /> {/* Adjust width, ensure all ticks show */}
                                        <Tooltip formatter={(value) => `${value}%`} cursor={{ fill: 'rgba(230, 230, 250, 0.5)' }}/> {/* Added light cursor */}
                                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}> {/* Added slight radius to bars */}
                                             {comparisonData.map((entry, index) => (
                                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                             ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <button
                                onClick={nextQuestion}
                                disabled={isSubmitting} // Disable button while submitting
                                className={`w-full font-bold py-3 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 text-sm ${
                                    isSubmitting
                                    ? 'bg-gray-400 text-gray-700 cursor-wait'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                                }`}
                            >
                                {isSubmitting ? 'กำลังบันทึก...' : (currentQuestionIndex < questions.length - 1 ? 'ถัดไป' : 'ดูผลลัพธ์')}
                            </button>
                        </div>
                    )}
                </div>
           </div>
        </div>
    );
};


// --- App Component (Router Setup) ---
// The main export now sets up the router
const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route that captures the optional suffix */}
                {/* Example: /facebookcampaign -> suffix = "facebookcampaign" */}
                {/* Example: / -> suffix = undefined */}
                <Route path="/:suffix?" element={<SurveyComponent />} />
                {/* No need for separate "/" route, the optional param handles it */}
            </Routes>
        </BrowserRouter>
    );
};

export default App;