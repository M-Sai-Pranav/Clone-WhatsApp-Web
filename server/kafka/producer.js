import Kafka from 'kafkajs';
async function Producer(kafka){


    const producer = kafka.producer();

    // Connect to the producer
    await producer.connect()

    // Send an event to the demoTopic topic
    // await producer.send({
    //   topic: 'demoTopic',
    //   messages: [
    //     { value: 'Hello micro-services world!' },
    //   ],
    // });

    // Disconnect the producer once we're done
    // await producer.disconnect();
    return producer;
}
export default  {Producer}

