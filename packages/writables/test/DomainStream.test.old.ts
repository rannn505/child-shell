import { DomainStream } from '../lib/DomainStream';

// describe('DomainStream', () => {
//   const DATA = 'data';
//   test('isEmpty', () => {
//     // Arrange:
//     const stream = new DomainStream();

//     // Act:
//     const res1 = stream.isEmpty();
//     stream.write(DATA);
//     const res2 = stream.isEmpty();

//     // Assert:
//     expect(res1).toBe(true);
//     expect(res2).toBe(false);
//   });

//   test('getContent', () => {
//     // Arrange:
//     const stream = new AccumulateStream();

//     // Act:
//     stream.write(DATA);
//     const res = Buffer.compare(Buffer.from(DATA), stream.getContent());

//     // Assert:
//     expect(res).toBe(0);
//   });
// });
