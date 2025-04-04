"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe("pk_test_51R91vrPbbfCp8zjVn18peJqrR2xvL2Q28PV39fa8QBqXui9u47abRheE0tWjEUff53ryeo3GBR25UyzCl1ZDSgX5007KhHxUn7");
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';

function Checkout() {
    const [cart, setCart] = useState<any[]>([]);  // Send Cart data is array
    const [userInfo, setUserInfo] = useState({
        name: "",
        address: "",
        city: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [saveInfo, setSaveInfo] = useState(false);
    const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

    const stripe = useStripe();
    const elements = useElements();
    const cardElement = elements?.getElement(CardElement);

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(storedCart);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.type === "checkbox") {
            if (e.target.name === "saveInfo") {
                setSaveInfo(e.target.checked);
            } else if (e.target.name === "useShippingAsBilling") {
                setUseShippingAsBilling(e.target.checked);
            }
        } else {
            setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
        }
    };

    const handlePayment = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("You need to log in before making a payment!");
            return;
        }

        setLoading(true);

        try {
            // Get total price of cart
            const totalAmount = getTotal() * 100; // Convert to cents
            if (totalAmount <= 0) {
                alert("Cart is empty!");
                setLoading(false);
                return;
            }

            // Send cart data to the server to create an order
            const orderResponse = await fetch(
                "http://localhost:1337/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        data: {
                            users_permissions_user: { id: 2 },
                            totalPrice: getTotal(),
                            name: userInfo.name,
                            address: userInfo.address,
                            city: userInfo.city,
                            phone: userInfo.phone,
                            statusCheckout: "Pending",
                            lineItems: cart.map((item) => ({
                                product: { id: item.id },
                                quantity: item.quantity,
                                price: item.price,
                            })),
                        },
                    }),
                }
            );

            const orderData = await orderResponse.json();
            if (!orderResponse.ok) {
                alert("Failed to place order!");
                setLoading(false);
                return;
            }

            console.log("Order created:", orderData);
            const orderId = orderData.data.id; // Get order id from response
            let finalOrderId = orderId - 1;

            // Wait for a few seconds to ensure the order is fully created
            setTimeout(async () => {
                if (!stripe || !elements) {
                    alert("Stripe is not loaded!");
                    setLoading(false);
                    return;
                }

                const cardElement = elements.getElement(CardElement);
                if (!cardElement) {
                    alert("Card Element not found!");
                    setLoading(false);
                    return;
                }

                // Create PaymentMethod
                const { error: pmError, paymentMethod } =
                    await stripe.createPaymentMethod({
                        type: "card",
                        card: cardElement,
                        billing_details: {
                            name: userInfo.name,
                            email: "email@example.com",
                        },
                    });

                if (pmError) {
                    console.error("Payment method creation failed:", pmError);
                    alert(`Payment failed: ${pmError.message}`);
                    setLoading(false);
                    return;
                }

                console.log("Payment Method created:", paymentMethod);

                // Create payment intent and link it with order
                const paymentResponse = await fetch(
                    "http://localhost:1337/api/payments",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            data: {
                                amount: totalAmount / 100,
                                currency: "USD",
                                statusPayment: "Pending",
                                users_permissions_user: { id: 2 },
                                order: { id: finalOrderId },
                                paymentIntentId: paymentMethod.id,
                            },
                        }),
                    }
                );

                const paymentData = await paymentResponse.json();
                console.log("Payment response:", paymentData); // Log the entire payment response

                if (!paymentResponse.ok || !paymentData.clientSecret) {
                    alert("Failed to create payment intent!");
                    setLoading(false);
                    return;
                }

                console.log("Payment Intent created:", paymentData);

                // Confirm Payment
                const { error, paymentIntent } = await stripe.confirmCardPayment(
                    paymentData.clientSecret,
                    {
                        payment_method: paymentMethod.id,
                    }
                );

                if (error) {
                    console.error("Payment failed:", error);
                    alert(`Payment failed: ${error.message}`);
                } else if (paymentIntent && paymentIntent.status === "succeeded") {
                    alert("Payment successful!");
                    localStorage.setItem("cart", "[]");
                    setCart([]);
                }
            }, 3000); // Delay 3 seconds to ensure order is created
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString()}`;
    };


    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row">
                        {/* Left side */}
                        <section className="md:w-2/3 p-6 overflow-y-auto">
                            {/* Information section */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">Delivery</h2>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your name"
                                    className="w-full p-3 border rounded-xl mb-4"
                                    value={userInfo.name}
                                    onChange={handleChange}
                                />
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Your phone number"
                                    className="w-full p-3 border rounded-xl mb-4"
                                    value={userInfo.phone}
                                    onChange={handleChange}
                                />
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Address"
                                        className="w-full p-3 border rounded-xl"
                                        value={userInfo.address}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        className="w-full p-3 border rounded-xl"
                                        value={userInfo.city}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Shipping method */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">Shipping method</h2>
                                <div className="border rounded-xl p-3 flex justify-between items-center bg-rose-50">
                                    <span>Standard</span>
                                    <span className="font-semibold">FREE</span>
                                </div>
                            </div>

                            {/* Payment section */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">Payment</h2>
                                <div className="border rounded-xl mb-4">
                                    <div className="p-3 flex justify-between items-center rounded-xl bg-rose-100">
                                        <span className="font-medium ">Credit card</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* Card Number */}
                                        <div className="h-10 bg-gray-200 rounded-xl">
                                            <CardElement className="border p-3 rounded-md" />
                                            {/* <CardNumberElement id="cardNumber" className="w-full p-2" /> */}
                                        </div>

                                        {/* Expiration Date and Verification Code */}
                                        {/* <div className="flex space-x-4">
                                            <div className="h-10 bg-gray-200 rounded-xl w-2/3">
                                                <CardExpiryElement id="expiryDate" className="w-full p-2" />
                                            </div>
                                            <div className="h-10 bg-gray-200 rounded-xl w-1/3">
                                                <CardCvcElement id="cvc" className="w-full p-2" />
                                            </div>
                                        </div>
                                         */}
                                    </div>
                                </div>
                            </div>


                        </section>

                        {/* Right side */}
                        <aside className="md:w-1/3 pt-24 pr-20 bg-gray-100 p-6 md:fixed md:top-0 md:right-0 md:bottom-0 md:overflow-y-auto">
                            <div className="max-w-md mx-auto h-full flex flex-col">
                                <div className="flex-grow">
                                    <div className="mb-6 space-y-4">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex items-center">
                                                <div className="relative mr-4">
                                                    <div className="w-16 h-16 rounded-md flex items-center justify-center overflow-hidden">
                                                        <Image
                                                            src={item.image || "/placeholder.jpg"}
                                                            alt={item.title || "No Title"}
                                                            width={64}
                                                            height={64}
                                                            className="w-16 h-16 object-cover"
                                                        />
                                                        <div className="absolute -top-2 -right-2 bg-rose-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                                                            {item.quantity}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <p>{item.title}</p>
                                                </div>
                                                <div className="text-right">
                                                    {formatCurrency(item.price)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-300 pt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal · {cart.length} items</span>
                                            <span>{formatCurrency(getTotal())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span className="font-medium text-sm text-rose-500">
                                                FREE
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center">
                                        <span className="text-lg font-medium">Total</span>
                                        <div className="text-2xl font-bold text-rose-500">
                                            {formatCurrency(getTotal())}
                                        </div>
                                    </div>
                                </div>
                                {/* Button Pay now */}
                                <div className="mb-8">
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-full text-center font-bold text-white ${loading ? "bg-rose-400" : "bg-rose-400 hover:bg-rose-500"
                                            }`}
                                    >
                                        {loading ? "Processing..." : "PAY NOW"}
                                    </button>
                                </div>
                            </div>

                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function CheckoutPage() {
    return (
        <Elements stripe={stripePromise}>
            <Checkout />
        </Elements>
    );
}
