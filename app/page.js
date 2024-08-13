'use client';
import React, { useState, useEffect } from "react";
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {useRouter} from 'next/navigation';
import {signOut} from 'firebase/auth';

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [isReduceScreenVisible, setIsReduceScreenVisible] = useState(false);
  const [addedQuantity, setAddedQuantity] = useState("");
  const [isUpdateScreenVisible, setIsUpdateScreenVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reduceQuantity, setReduceQuantity] = useState("");
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [searchedItem, setSearchedItem] = useState(null);
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userSession = sessionStorage.getItem('user');
      if (!user && !userSession) {
        router.push('/sign-in');
      }
    }
  }, [user, router]);

  // Add item to the database
  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== "" && newItem.quantity !== "") {
      await addDoc(collection(db, "pantry management"), {
        name: newItem.name.trim(),
        quantity: parseInt(newItem.quantity),
      });
      setNewItem({ name: "", quantity: "" });
    }
  };

  // Update quantity in the database
  const updateQuantity = async (item) => {
    setSelectedItem(item);
    setIsUpdateScreenVisible(true);
  };

  const handleUpdate = async () => {
    if (selectedItem && addedQuantity > 0) {
      const docRef = doc(db, "pantry management", selectedItem.id);
      const updatedQuantity = parseInt(addedQuantity) + parseInt(selectedItem.quantity);
      await updateDoc(docRef, { quantity: updatedQuantity });
      setItems(items.map((item) =>
        item.id === selectedItem.id
          ? { ...item, quantity: updatedQuantity }
          : item
      ));
      setIsUpdateScreenVisible(false);
      setAddedQuantity("");
    } else {
      alert("Please enter a valid quantity to add");
    }
  };

  // Read items from the database
  useEffect(() => {
    if (!isUserSearching) {
      const q = query(collection(db, "pantry management"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const itemArr = [];
        querySnapshot.forEach((doc) => {
          itemArr.push({ ...doc.data(), id: doc.id });
        });
        setItems(itemArr);
      });
      return () => unsubscribe();
    }
  }, [isUserSearching]);

  // Show the reduce item screen
  const reduceItem = (item) => {
    setSelectedItem(item);
    setIsReduceScreenVisible(true);
  };

  // Handle reducing the item quantity
  const handleReduce = async () => {
    if (selectedItem && reduceQuantity > 0) {
      const updatedQuantity = selectedItem.quantity - parseInt(reduceQuantity);

      if (updatedQuantity > 0) {
        const docRef = doc(db, "pantry management", selectedItem.id);
        await updateDoc(docRef, { quantity: updatedQuantity });

        setItems(items.map((item) =>
          item.id === selectedItem.id
            ? { ...item, quantity: updatedQuantity }
            : item
        ));

        // Close the reduce screen
        setIsReduceScreenVisible(false);
        setReduceQuantity("");
      } else if (updatedQuantity === 0) {
        removeItem(selectedItem.id);
        setIsReduceScreenVisible(false);
        setReduceQuantity("");
      } else {
        alert("You can't reduce more than you have!");
      }
    }
  };

  // Remove item from the database
  const removeItem = async (id) => {
    const docRef = doc(db, "pantry management", id);
    await deleteDoc(docRef);
    setItems(items.filter((item) => item.id !== id));
  };

  // Search item from the database
  const searchItem = async (e) => {
    e.preventDefault();
    setIsUserSearching(true);
    const foundItem = items.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
    setSearchedItem(foundItem || null);
    setNewItem({ name: "", quantity: "" });
  };

  // Reset search
  const resetSearch = () => {
    setIsUserSearching(false);
    setSearchedItem(null);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-100">
      <div className="m-0 p-0 flex items-center justify-between bg-gray-900 w-full">
        <h1 className="text-2xl text-white">Inventory Management</h1>
        <div>
            <button 
            onClick={() => {signOut(auth)
               sessionStorage.removeItem('user')}}
            className="p-2 bg-blue-600 text-white rounded">Log out</button>
        </div>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-5xl w-full p-6 bg-slate-950 rounded-lg shadow-md">
          <h1 className="text-4xl text-center text-white mb-6">Pantry Manager</h1>
          <form className="grid grid-cols-6 gap-4 mb-6">
            <input
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              value={newItem.name}
              type="text"
              placeholder="Item Name"
              className="col-span-3 p-4 border text-black"
            />
            <input
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              value={newItem.quantity}
              type="number"
              placeholder="Quantity"
              className="col-span-1 p-4 border text-black"
            />
            <button onClick={addItem} className="bg-slate-700 hover:bg-black text-white text-lg p-4 rounded-lg col-span-1">
              Add Item
            </button>
            <button onClick={searchItem} className="bg-slate-700 hover:bg-black text-white text-lg p-4 rounded-lg col-span-1">
              Search
            </button>
          </form>


          {isUserSearching && (
            <div className="mb-6">
              {searchedItem ? (
                <div>
                  <p className="text-white">Item found:</p>
                  <ul>
                    <li className="my-4 w-full flex justify-between text-lg">
                      <div className="p-4 w-full flex justify-between text-white">
                        <span>{searchedItem.name}</span>
                        <span>{searchedItem.quantity}</span>
                      </div>
                      <div className="flex">
                        <button onClick={() => updateQuantity(searchedItem)} className="bg-slate-400 hover:bg-slate-900 text-white p-2 rounded-lg mx-2">
                          Add
                        </button>
                        <button onClick={() => reduceItem(searchedItem)} className="bg-slate-400 hover:bg-slate-900 text-white p-2 rounded-lg">
                          Remove
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              ) : (
                <p className="text-white">No item found</p>
              )}
              <button onClick={resetSearch} className="bg-slate-700 hover:bg-black text-white text-lg p-4 rounded-lg">
                Back
              </button>
            </div>
          )}

          {!isUserSearching && (
            <ul>
              {items.map((item, id) => (
                <li key={id} className="my-4 w-full flex justify-between text-lg">
                  <div className="p-4 w-full flex justify-between text-white">
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div className="flex">
                    <button onClick={() => updateQuantity(item)} className="bg-slate-400 hover:bg-slate-900 text-white p-2 rounded-lg mx-2">
                      Add
                    </button>
                    <button onClick={() => reduceItem(item)} className="bg-slate-400 hover:bg-slate-900 text-white p-2 rounded-lg">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isReduceScreenVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="bg-slate-950 p-8 rounded-lg">
                <h2 className="text-xl text-center text-white">Reduce {selectedItem.name}</h2>
                <input
                  type="number"
                  value={reduceQuantity}
                  onChange={(e) => setReduceQuantity(e.target.value)}
                  className="border p-2 w-full mt-4 text-black"
                  placeholder="Quantity to reduce"
                />
                <button onClick={handleReduce} className="bg-red-500 text-white p-2 mt-4 rounded-lg">
                  Confirm Reduce
                </button>
                <button onClick={() => setIsReduceScreenVisible(false)} className="bg-gray-500 text-white p-2 mt-4 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isUpdateScreenVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="bg-slate-950 p-8 rounded-lg">
                <h2 className="text-xl text-center text-white">Update {selectedItem.name}</h2>
                <input
                  onChange={(e) => setAddedQuantity(e.target.value)}
                  type="number"
                  placeholder="Amount to add"
                  className="p-2 text-black border w-full mt-4"
                />
                <button onClick={handleUpdate} className="bg-slate-700 text-white p-2 rounded-lg w-full mt-4">
                  Add
                </button>
                <button onClick={() => setIsUpdateScreenVisible(false)} className="bg-slate-700 text-white p-2 rounded-lg w-full mt-2">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
