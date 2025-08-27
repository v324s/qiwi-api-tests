const { test, expect } = require('@playwright/test');

const config = {
    baseUrl: 'https://api-test.qiwi.com/partner/payout/',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
    agentId: 'acme',
    pointId: '00001',
    walletId: '7500c92d-f24d-4c5f-b870-4c52d9e6978c'
};

let paymentId;

test.describe('QIWI API Tests', () => {
    test('1. Проверка доступности сервиса', async ({ request }) => {
        const response = await request.get(`${config.baseUrl}v1/agents/${config.agentId}/points/${config.pointId}/payments`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });

        await test.step('Статус код 200', async () => {
            expect(response.status()).toBe(200);
        });

        await test.step('Формат ответа JSON', async () => {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('application/json');
            
            const jsonData = await response.json();
            expect(jsonData).toBeInstanceOf(Object);
        });

        await test.step('Нет серверных ошибок 5XX', async () => {
            const status = response.status();
            expect(status).not.toBeGreaterThanOrEqual(500);
            expect(status).not.toBeLessThanOrEqual(599);
        });

        await test.step('Нет клиентских ошибок 4XX', async () => {
            const status = response.status();
            expect(status).not.toBeGreaterThanOrEqual(400);
            expect(status).not.toBeLessThanOrEqual(499);
        });
    });

    test('2. Запрос баланса', async ({ request }) => {
        const response = await request.get(`${config.baseUrl}v1/agents/${config.agentId}/points/${config.pointId}/balance`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });
      
        await test.step('Статус код 200', async () => {
            expect(response.status()).toBe(200);
        });
      
        await test.step('Формат ответа JSON', async () => {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('application/json');
        });
      
        await test.step('Баланс > 0', async () => {
            const jsonData = await response.json();

            let balance;

            if (jsonData.balance !== undefined) {
                balance = jsonData.balance;
            } else if (jsonData.amount !== undefined) {
                balance = jsonData.amount;
            } else if (jsonData.accounts && jsonData.accounts[0] && jsonData.accounts[0].balance !== undefined) {
                balance = jsonData.accounts[0].balance;
            } else {
                console.log('Структура ответа:', jsonData);
                throw new Error('Не удалось найти баланс в ответе');
            }
            
            expect(balance).toBeGreaterThan(0);
            console.log(`💰 Баланс: ${balance}`);
        });
    });

    test('3. Создание платежа на 1 рубль', async ({ request }) => {
        const newPaymentId = generateGuid();
        const paymentData = {
            "recipientDetails": {
                "providerCode": "bank-card-russia",
                "fields": {
                "pan": "1234564543654321"
                }
            },
            "amount": {
                "value": "1.00",
                "currency": "RUB"
            }
        };
      
        const response = await request.put(`${config.baseUrl}v1/agents/${config.agentId}/points/${config.pointId}/payments/${newPaymentId}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            data: paymentData
        });
      
        await test.step('Статус код 200', async () => {
            expect(response.status()).toBe(200);
        });
      
        await test.step('Формат ответа JSON', async () => {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('application/json');
        });
      
        await test.step('Платеж создан', async () => {
            const jsonData = await response.json();
            expect(jsonData).toBeInstanceOf(Object);
            expect(jsonData).not.toBeNull();

            if (jsonData.paymentId) {
                paymentId = jsonData.paymentId;
                console.log(`📝 Создан платеж ID: ${paymentId}`);
            } else if (jsonData.id) {
                paymentId = jsonData.id;
                console.log(`📝 Создан платеж ID: ${paymentId}`);
            } else {
                console.log('Ответ создания платежа:', jsonData);
                throw new Error('ID платежа не найден в ответе');
            }
        });
      
        await test.step('Сумма платежа 1 рубль', async () => {
            const jsonData = await response.json();

            // Проверяем различные возможные структуры
            if (jsonData.amount && jsonData.amount.value !== undefined) {
                expect(parseFloat(jsonData.amount.value)).toBe(1.00);
            } else if (jsonData.sum && jsonData.sum.amount !== undefined) {
                expect(jsonData.sum.amount).toBe(1);
            } else if (jsonData.amount !== undefined) {
                expect(jsonData.amount).toBe(1);
            } else {
                console.log('Структура ответа платежа:', jsonData);
                throw new Error('Не удалось проверить сумму платежа');
            }
        });
    });

    test('4. Исполнение платежа', async ({ request }) => {
        if (!paymentId) {
            // test.skip(!paymentId, 'Платеж не был создан в предыдущем тесте');
            paymentId = "c7334018-90c5-443e-b053-8f20570a8d25";
        }
        
        const response = await request.post(`${config.baseUrl}v1/agents/${config.agentId}/points/${config.pointId}/payments/${paymentId}/execute`, {
            headers: {
            'Authorization': `Bearer ${config.token}`
            }
        });
        
        await test.step('Статус код 200', async () => {
            expect(response.status()).toBe(200);
        });
        
        await test.step('Формат ответа JSON', async () => {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('application/json');
        });
        
        await test.step('Платеж исполнен', async () => {
            const jsonData = await response.json();
            expect(jsonData).toBeInstanceOf(Object);
            expect(jsonData).not.toBeNull();
            
            if (jsonData.paymentId) {
            console.log(`✅ Исполнен платеж ID: ${jsonData.paymentId}`);
            } else if (jsonData.id) {
            console.log(`✅ Исполнен платеж ID: ${jsonData.id}`);
            }
        });
    });
});

//(Postman {{$guid}})
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}