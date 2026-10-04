"use strict";

const STORAGE_KEY = "kakeibo-records";
const form = document.querySelector("#entry-form");
const totalAmount = document.querySelector("#total-amount");
const recordsList = document.querySelector("#records-list");
const appStatus = document.querySelector("#app-status");
const submitButton = form.querySelector('button[type="submit"]');
const yenFormatter = new Intl.NumberFormat("ja-JP");

let records = [];
let storageAvailable = true;

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.item === "string" &&
    (value.type === "income" || value.type === "expense") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function setStatus(message) {
  appStatus.textContent = message;
}

function renderRecords() {
  recordsList.replaceChildren();

  if (records.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "登録されたデータはありません";
    recordsList.append(emptyItem);
  } else {
    records.forEach((record) => {
      const item = document.createElement("li");
      const [year, month, day] = record.date.split("-");
      const typeLabel = record.type === "income" ? "収入" : "支出";
      const amountSign = record.type === "income" ? "+" : "-";
      item.textContent = `${year}年${Number(month)}月${Number(day)}日　${record.item}　${typeLabel}　${amountSign}${yenFormatter.format(record.amount)}円`;
      recordsList.append(item);
    });
  }

  const balance = records.reduce(
    (sum, record) =>
      sum + (record.type === "income" ? record.amount : -record.amount),
    0,
  );
  totalAmount.textContent = `${yenFormatter.format(balance)}円`;
}

function loadRecords() {
  try {
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    if (savedRecords === null) {
      return;
    }

    const parsedRecords = JSON.parse(savedRecords);
    if (!Array.isArray(parsedRecords) || !parsedRecords.every(isRecord)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    records = parsedRecords;
  } catch (error) {
    storageAvailable = false;
    submitButton.disabled = true;
    setStatus(
      `保存データを読み込めませんでした。データを保護するため登録を停止しました。詳細: ${error.message}`,
    );
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageAvailable) {
    return;
  }

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const record = {
    date: formData.get("date"),
    item: formData.get("item").trim(),
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
  };

  if (!isRecord(record)) {
    setStatus("入力内容を確認してください。金額は1円以上の整数を入力してください。");
    return;
  }

  const updatedRecords = [...records, record];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  } catch (error) {
    setStatus(`データを保存できませんでした。入力内容は追加されていません。詳細: ${error.message}`);
    return;
  }

  records = updatedRecords;
  renderRecords();
  form.reset();
  setStatus("収支を保存しました。");
});

loadRecords();
renderRecords();
