import React, { useState, useEffect } from 'react';
import { ShippingMethodsProps, ShippingMethod, LineItem } from '@/../types/shipping';
import { fetchShippingMethodsApi } from '@/api/shipping';

const ShippingMethods: React.FC<ShippingMethodsProps> = ({ lineItems, totalPrice, onSelectShippingMethod }) => {
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [shippingCosts, setShippingCosts] = useState<{ [key: string]: number }>({});
    useEffect(() => {
        const loadShippingMethods = async () => {
            try {
                const methods = await fetchShippingMethodsApi();
                setShippingMethods(methods);
            } catch (error) {
                console.error('Error loading shipping methods:', error);
            }
        };

        loadShippingMethods();
    }, []);

    useEffect(() => {
        if (shippingMethods.length > 0) {
            calculateShippingCosts();
        }
    }, [shippingMethods, lineItems, totalPrice]); // Add totalPrice to dependencies

    const calculateShippingCosts = () => {
        const calculatedCosts: { [key: string]: number } = {};
        shippingMethods.forEach((method) => {
            let totalWeight = 0;
            let totalVolume = 0;

            lineItems.forEach((item) => {
                totalWeight += item.weight * item.quantity;
                totalVolume += item.length * item.width * item.height * item.quantity;
            });

            let shippingCost = 0;
            if (method.shippingMethodId === 'FREE_OVER' && totalPrice >= 50) {
                shippingCost = 0;
            } else {
                const applicableRate = method.shipping_rates.find(
                    (rate) => totalWeight >= rate.minWeight && totalWeight <= rate.maxWeight &&
                        totalVolume >= rate.minVolume && totalVolume <= rate.maxVolume
                );
                if (applicableRate) {
                    shippingCost = applicableRate.flatRate +
                        (applicableRate.pricePerWeight * totalWeight) +
                        (applicableRate.pricePerVolume * totalVolume);
                }
            }
            calculatedCosts[method.shippingMethodId] = shippingCost;
        });
        setShippingCosts(calculatedCosts);
    };

    const handleSelectMethod = (methodId: string, cost: number) => {
        setSelectedMethod(methodId);
        onSelectShippingMethod(methodId, cost);
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Shipping Method</h1>
            {shippingMethods.map((method) => (
                <div key={method.id} className="mb-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value={method.shippingMethodId}
                            checked={selectedMethod === method.shippingMethodId}
                            onChange={() => handleSelectMethod(method.shippingMethodId, shippingCosts[method.shippingMethodId] || 0)}
                            className="mr-2"
                        />
                        <span>{method.nameShippingMethod}</span> ---
                        <span>{shippingCosts[method.shippingMethodId] !== undefined ? ` $${shippingCosts[method.shippingMethodId]?.toFixed(2)}` : ' Calculating...'}</span>
                    </label>
                    <p className="text-sm text-gray-500">{method.descriptionShippingMethod.map((desc: any, index: number) => (
                        <span key={index}>{desc?.children?.map((child: any, childIndex: number) => (
                            <span key={childIndex}>{child?.text}</span>
                        ))}</span>
                    ))}</p>
                </div>
            ))}
        </div>
    );
};

export default ShippingMethods;
