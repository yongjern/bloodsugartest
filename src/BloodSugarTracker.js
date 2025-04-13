import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS = [
  "早餐前", "早餐後", "午餐前", "午餐後", "晚餐前", "晚餐後", "睡覺前"
];

export default function BloodSugarTracker() {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState(STATUS[0]);
  const [glucose, setGlucose] = useState("");
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];
    setDate(formattedToday);
    setSelectedDate(formattedToday);
  }, []);

  const addEntry = () => {
    if (!date || !glucose) return;
    const numericGlucose = parseFloat(glucose);
    if (numericGlucose < 0) {
      setError("血糖指數不能為負值。");
      return;
    }
    setError("");
    const newData = [...data, { date, status, glucose: numericGlucose.toFixed(1) }];
    setData(newData);
    setGlucose("");
  };

  const adjustGlucose = (amount) => {
    const value = parseFloat(glucose || "0");
    const newValue = Math.max(0, value + amount).toFixed(1);
    setGlucose(newValue);
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const days = getLast7Days();
      const body = days.map(date => {
        const row = [date];
        STATUS.forEach(s => {
          const entry = data.find(e => e.date === date && e.status === s);
          row.push(entry ? entry.glucose : "-");
        });
        return row;
      });

      autoTable(doc, {
        head: [["日期", ...STATUS]],
        body: body
      });
      doc.save(`血糖紀錄-${selectedDate}.pdf`);
    } catch (e) {
      console.error("PDF 生成錯誤：", e);
    }
  };

  const getLast7Days = () => {
    const result = [];
    if (!selectedDate) return result;
    const today = new Date(selectedDate);
    if (isNaN(today.getTime())) return result;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result.push(d.toISOString().split("T")[0]);
    }
    return result;
  };

  const handleGlucoseInput = (e) => {
    const value = e.target.value;
    const floatVal = parseFloat(value);
    if (!isNaN(floatVal)) {
      setGlucose(floatVal.toFixed(1));
    } else {
      setGlucose("");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardContent className="space-y-4">
          <div>
            <Label>日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>狀態</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS.map(s => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>血糖指數</Label>
            <div className="flex items-center gap-2">
              <Button onClick={() => adjustGlucose(-0.1)}>-0.1</Button>
              <Input
                type="number"
                step="0.1"
                value={glucose}
                onChange={handleGlucoseInput}
              />
              <Button onClick={() => adjustGlucose(0.1)}>+0.1</Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <Button onClick={addEntry}>新增紀錄</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent>
          <div className="mb-4">
            <Label>查詢日期</Label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <h2 className="text-xl font-bold mb-2">7 天內血糖圖表（結束於 {selectedDate}）</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border p-2">日期</th>
                {STATUS.map(s => (
                  <th key={s} className="border p-2">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getLast7Days().map(d => (
                <tr key={d}>
                  <td className="border p-2 font-medium">{d}</td>
                  {STATUS.map(s => {
                    const entry = data.find(e => e.date === d && e.status === s);
                    return (
                      <td key={s} className="border p-2 text-center">{entry ? entry.glucose : "-"}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-4" onClick={generatePDF}>匯出 PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
}
