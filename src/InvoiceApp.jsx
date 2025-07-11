import React, { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVr14LrDoSgMNCC42KoDH2UDzZTob-Y0Y",
  authDomain: "invoicesync-c0677.firebaseapp.com",
  projectId: "invoicesync-c0677",
  storageBucket: "invoicesync-c0677.firebasestorage.app",
  messagingSenderId: "825474089888",
  appId: "1:825474089888:web:e2f9ce61230ac3e8ee1ac5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Input = (props) => <input className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} />;
const Button = (props) => <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded shadow" {...props} />;
const Card = ({ children }) => <div className="bg-white border rounded shadow p-4 my-4">{children}</div>;
const CardContent = ({ children }) => <div className="space-y-3">{children}</div>;

export default function InvoiceApp() {
  const invoiceRef = useRef();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "00001",
    from: "Ryme Interiors",
    to: "",
    toAddress: "",
    items: [{ description: "", quantity: "", price: "" }],
    discount: "",
    tax: "",
    notes: "",
    currency: "₦",
  });

  const [logo, setLogo] = useState(() => {
    return localStorage.getItem("invoiceLogo") || "/default-logo.png";
  });

  const getNextInvoiceNumber = async () => {
  const metaDocRef = doc(db, "meta", "invoiceCounter");
  const metaDoc = await getDoc(metaDocRef);

  let currentNumber = 1;

  if (metaDoc.exists()) {
    currentNumber = metaDoc.data().lastNumber + 1;
  }

  // Update Firestore with new number
  await setDoc(metaDocRef, { lastNumber: currentNumber });

  // Save locally too
  localStorage.setItem("lastInvoiceNumber", String(currentNumber).padStart(4, '0'));

  return String(currentNumber).padStart(4, '0');
};

const createNewInvoice = async () => {
  const nextNumber = await getNextInvoiceNumber();

  setInvoiceData({
    invoiceNumber: nextNumber,
    from: "Ryme Interiors",
    to: "",
    toAddress: "",
    items: [{ description: "", quantity: "", price: "" }],
    discount: "",
    tax: "",
    notes: "",
    currency: invoiceData.currency,
  });
};



  const [savedInvoices, setSavedInvoices] = useState(() => {
    const saved = localStorage.getItem("savedInvoices");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedInvoice, setSelectedInvoice] = useState("");

  useEffect(() => {
  const initInvoiceNumber = async () => {
    const stored = localStorage.getItem("lastInvoiceNumber");
    if (stored) {
      setInvoiceData(prev => ({ ...prev, invoiceNumber: stored }));
    } else {
      const next = await getNextInvoiceNumber();
      setInvoiceData(prev => ({ ...prev, invoiceNumber: next }));
    }
  };
  initInvoiceNumber();
}, []);

  const updateItem = (index, key, value) => {
    const items = [...invoiceData.items];
    items[index][key] = value;
    setInvoiceData({ ...invoiceData, items });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    const items = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + quantity * price;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(invoiceData.discount) || 0;
    const tax = parseFloat(invoiceData.tax) || 0;
    const discounted = subtotal - (subtotal * discount) / 100;
    return discounted + (discounted * tax) / 100;
  };

  const downloadPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: auto; padding: 40px; color: #222;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px;">
          <div>
            ${logo ? `<img src="${logo}" style="height: 60px;" />` : "<h2>Your Logo</h2>"}
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">INVOICE</h1>
            <p style="margin: 4px 0;">Invoice #: <strong>${invoiceData.invoiceNumber}</strong></p>
            <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
          </div>
        </div>

        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin-bottom: 5px;">Billed To:</h3>
            <p><strong>${invoiceData.to}</strong></p>
            <p>${invoiceData.toAddress}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin-bottom: 5px;">From:</h3>
            <p><strong>${invoiceData.from}</strong></p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
  <thead>
    <tr style="background-color: #000000; color: #ffffff; height: 30px;">
      <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Description</th>
      <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Price</th>
      <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Quantity</th>
      <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${invoiceData.items.map(item => `
      <tr>
        <td style="padding: 12px; border: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; text-align: center; border: 1px solid #eee;">
          ${invoiceData.currency} ${Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px; text-align: center; border: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border: 1px solid #eee;">
          ${invoiceData.currency} ${Number(item.price * item.quantity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join("")}
  </tbody>
</table>

<div style="margin-top: 30px; display: flex; justify-content: flex-end;">
  <table style="width: 300px;">
    <tr>
      <td style="padding: 8px 0;">Subtotal:</td>
      <td style="text-align: right;">${invoiceData.currency} ${Number(calculateSubtotal()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0;">Discount (${invoiceData.discount}%):</td>
      <td style="text-align: right;">-${invoiceData.currency} ${Number((calculateSubtotal() * invoiceData.discount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0;">Tax (${invoiceData.tax}%):</td>
      <td style="text-align: right;">+${invoiceData.currency} ${Number(((calculateSubtotal() - (calculateSubtotal() * invoiceData.discount / 100)) * invoiceData.tax / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr style="border-top: 2px solid #ccc;">
      <td style="padding: 12px 0; font-weight: bold;">Total Due:</td>
      <td style="text-align: right; font-weight: bold; color: #000;">${invoiceData.currency} ${Number(calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
    </tr>
  </table>
</div>

<div style="text-align: center; margin-top: 50px; color: #555; font-style: italic;">
  <p>Thank you for your business!</p>
</div>

    `;

    html2pdf().set({
      margin: 0,
      filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }).from(element).save();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
      localStorage.setItem("invoiceLogo", reader.result);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleCurrencyChange = (e) => {
    setInvoiceData({ ...invoiceData, currency: e.target.value });
  };

  const handleSaveInvoice = async () => {
    const name = prompt("Enter a name for this invoice:", invoiceData.invoiceNumber);
    if (!name) return;
    setSavedInvoices({ ...savedInvoices, [name]: invoiceData });
    await setDoc(doc(db, "invoices", name), invoiceData);
    alert("Invoice saved to cloud and local as " + name);
  };

  const syncFromCloud = async () => {
    const name = prompt("Enter the name of the invoice to fetch:");
    const docSnap = await getDoc(doc(db, "invoices", name));
    if (docSnap.exists()) {
      setInvoiceData(docSnap.data());
      alert("Invoice loaded from cloud.");
    } else {
      alert("No such invoice found in cloud.");
    }
  };

  const handleLoadInvoice = (e) => {
    const name = e.target.value;
    if (!name || !savedInvoices[name]) return;
    setInvoiceData(savedInvoices[name]);
    setSelectedInvoice(name);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Invoice Generator</h1>

        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
          <Button onClick={handleSaveInvoice}>Save Invoice</Button>
          <Button onClick={syncFromCloud}>Sync from Cloud</Button>
          <select value={selectedInvoice} onChange={handleLoadInvoice} className="border rounded px-3 py-2">
            <option value="">Load Saved Invoice</option>
            {Object.keys(savedInvoices).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <Card>
          <CardContent>
            <label className="block mb-2 font-medium text-gray-700">Upload Logo</label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} />
            {logo && (
  <img
    src={logo}
    alt="Logo Preview"
    className="mt-4 h-20 max-h-24 w-auto max-w-full object-contain"
  />
)}


            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Invoice Number" value={invoiceData.invoiceNumber} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} />
              <select value={invoiceData.currency} onChange={handleCurrencyChange} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="₦">₦ - Naira</option>
                <option value="$">$ - Dollar</option>
                <option value="€">€ - Euro</option>
                <option value="£">£ - Pound</option>
                <option value="¥">¥ - Yen</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="From (Your Company Name)" value={invoiceData.from} onChange={(e) => setInvoiceData({ ...invoiceData, from: e.target.value })} />
              <Input placeholder="To (Client Name)" value={invoiceData.to} onChange={(e) => setInvoiceData({ ...invoiceData, to: e.target.value })} />
              <Input placeholder="Client Address" value={invoiceData.toAddress} onChange={(e) => setInvoiceData({ ...invoiceData, toAddress: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {invoiceData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                <Input type="number" placeholder="Quantity" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))} />
                <Input type="number" placeholder="Unit Price" value={item.price} onChange={(e) => updateItem(index, "price", parseFloat(e.target.value))} />
                <Button onClick={() => removeItem(index)}>Remove</Button>
              </div>
            ))}
            <Button onClick={addItem}>+ Add Item</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="number" placeholder="Discount %" value={invoiceData.discount} onChange={(e) => setInvoiceData({ ...invoiceData, discount: parseFloat(e.target.value) })} />
              <Input type="number" placeholder="Tax %" value={invoiceData.tax} onChange={(e) => setInvoiceData({ ...invoiceData, tax: parseFloat(e.target.value) })} />
              <Input placeholder="Notes" value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })} />
            </div>

            <div className="text-right">
                <p className="font-semibold text-lg mt-4">
                  Total: {invoiceData.currency} {Number(calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={downloadPDF}>Download PDF</Button>
        </div>
      </div>
    </div>
  );
}
