import Kafka from 'kafkajs';
async function Consumer(kafka){


const consumer = kafka.consumer({ groupId: 'test-group' })

    await consumer.connect()
    await consumer.subscribe({ topic: 'demoTopic', fromBeginning: true })

    // await consumer.run({
    //   eachMessage: async ({ topic, partition, message }) => {
    //     console.log({
    //       value: message.value.toString(),
    //     })
    //   },
    // });
    return consumer;
}

export default {Consumer}