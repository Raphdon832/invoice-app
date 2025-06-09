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
const Card = ({ children }) => <div className="bg-white border rounded shadow p-4 my-4 w-full">{children}</div>;
const CardContent = ({ children }) => <div className="space-y-3">{children}</div>;

export default function InvoiceApp() {
  const invoiceRef = useRef();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "000001",
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

  const [savedInvoices, setSavedInvoices] = useState(() => {
    const saved = localStorage.getItem("savedInvoices");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedInvoice, setSelectedInvoice] = useState("");

  useEffect(() => {
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
  }, [savedInvoices]);

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
      <div className="max-w-4xl mx-auto w-full">
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
            {logo && <img src={logo} alt="Logo Preview" className="mt-4 h-20 object-contain" />}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="number" placeholder="Discount %" value={invoiceData.discount} onChange={(e) => setInvoiceData({ ...invoiceData, discount: parseFloat(e.target.value) })} />
              <Input type="number" placeholder="Tax %" value={invoiceData.tax} onChange={(e) => setInvoiceData({ ...invoiceData, tax: parseFloat(e.target.value) })} />
              <Input placeholder="Notes" value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })} />
            </div>
            <p className="font-semibold text-right text-lg mt-4">
              Total: {invoiceData.currency} {Number(calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={() => downloadPDF()}>Download PDF</Button>
        </div>
      </div>
    </div>
  );
}
