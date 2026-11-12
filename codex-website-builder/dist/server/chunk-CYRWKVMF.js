import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);

// server/format-source.ts
import { readFile } from "fs/promises";

// node_modules/.pnpm/acorn@8.19.0/node_modules/acorn/dist/acorn.mjs
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 31, 4, 33, 15, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 199, 7, 137, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 55, 9, 7, 0, 259, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 481, 1, 61, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 12, 2, 9, 1, 3, 0, 33, 1, 1357, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 233, 0, 3, 0, 8, 1, 6, 0, 475, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 13, 65, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 7, 25, 39, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 5, 18, 21, 18, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 18, 0, 182, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 24, 43, 22, 0, 239, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 111, 6, 206, 13, 310, 2314, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 33, 24, 3, 24, 45, 74, 6, 0, 67, 12, 65, 1, 2, 0, 15, 4, 10, 7386, 37, 33, 96, 114, 14, 913, 15, 50, 7710, 3, 2, 6, 2, 1, 2, 296, 10, 0, 30, 2, 3, 0, 15, 4, 8, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 340, 2, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 129, 15, 6, 55, 50, 49, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 208, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 225, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4382, 2, 5773, 3, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 8489, 39815, 11327];
var nonASCIIidentifierChars = "\u200C\u200D\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7-\u05C9\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B53-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1AF0\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65";
var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0558\u0559\u0560-\u0588\u058B\u058C\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088F\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5C\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDC-\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u208F-\u209F\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7DD\uA7E2\uA7F1-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB6C\uAB6D\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};
var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
var keywords$1 = {
  5: ecma5AndLessKeywords,
  "5module": ecma5AndLessKeywords + " export import",
  6: ecma5AndLessKeywords + " const class extends export import super"
};
var keywordRelationalOperator = /^in(stanceof)?$/;
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
function isInAstralSet(code, set) {
  var pos = 65536;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) {
      return false;
    }
    pos += set[i + 1];
    if (pos >= code) {
      return true;
    }
  }
  return false;
}
function isIdentifierStart(code, astral) {
  if (code < 65) {
    return code === 36;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code, astral) {
  if (code < 48) {
    return code === 36;
  }
  if (code < 58) {
    return true;
  }
  if (code < 65) {
    return false;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
var TokenType = function TokenType2(label, conf) {
  if (conf === void 0) conf = {};
  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};
function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true };
var startsExpr = { startsExpr: true };
var keywords = {};
function kw(name, options) {
  if (options === void 0) options = {};
  options.keyword = name;
  return keywords[name] = new TokenType(name, options);
}
var types$1 = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  privateId: new TokenType("privateId", startsExpr),
  eof: new TokenType("eof"),
  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  questionDot: new TokenType("?."),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.
  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("!/~", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", { beforeExpr: true }),
  coalesce: binop("??", 1),
  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", { isLoop: true, beforeExpr: true }),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", { isLoop: true }),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", { isLoop: true }),
  _with: kw("with"),
  _new: kw("new", { beforeExpr: true, startsExpr: true }),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import", startsExpr),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", { beforeExpr: true, binop: 7 }),
  _instanceof: kw("instanceof", { beforeExpr: true, binop: 7 }),
  _typeof: kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true }),
  _void: kw("void", { beforeExpr: true, prefix: true, startsExpr: true }),
  _delete: kw("delete", { beforeExpr: true, prefix: true, startsExpr: true })
};
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  return code === 10 || code === 13 || code === 8232 || code === 8233;
}
function nextLineBreak(code, from, end) {
  if (end === void 0) end = code.length;
  for (var i = from; i < end; i++) {
    var next = code.charCodeAt(i);
    if (isNewLine(next)) {
      return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1;
    }
  }
  return -1;
}
var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;
var hasOwn = Object.hasOwn || (function(obj, propName) {
  return hasOwnProperty.call(obj, propName);
});
var isArray = Array.isArray || (function(obj) {
  return toString.call(obj) === "[object Array]";
});
var regexpCache = /* @__PURE__ */ Object.create(null);
function wordsRegexp(words) {
  return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"));
}
function codePointToString(code) {
  if (code <= 65535) {
    return String.fromCharCode(code);
  }
  code -= 65536;
  return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
}
var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
var Position = function Position2(line, col) {
  this.line = line;
  this.column = col;
};
Position.prototype.offset = function offset(n) {
  return new Position(this.line, this.column + n);
};
var SourceLocation = function SourceLocation2(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) {
    this.source = p.sourceFile;
  }
};
function getLineInfo(input, offset2) {
  for (var line = 1, cur = 0; ; ) {
    var nextBreak = nextLineBreak(input, cur, offset2);
    if (nextBreak < 0) {
      return new Position(line, offset2 - cur);
    }
    ++line;
    cur = nextBreak;
  }
}
var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must be
  // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
  // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
  // (the latest version the library supports). This influences
  // support for strict mode, the set of reserved words, and support
  // for new syntax features.
  ecmaVersion: null,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"`, `"module"` or `"commonjs"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // When set to true, enable strict parsing mode even if `sourceType`
  // is `"script"`.
  strict: false,
  // `onInsertedSemicolon` can be a callback that will be called when
  // a semicolon is automatically inserted. It will be passed the
  // position of the inserted semicolon as an offset, and if
  // `locations` is enabled, it is given the location as a `{line,
  // column}` object as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program, and an import.meta expression
  // in a script isn't considered an error.
  allowImportExportEverywhere: false,
  // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: null,
  // When enabled, super identifiers are not constrained to
  // appearing in methods and do not raise an error when they appear elsewhere.
  allowSuperOutsideMethod: null,
  // When enabled, hashbang directive in the beginning of file is
  // allowed and treated as a line comment. Enabled by default when
  // `ecmaVersion` >= 2023.
  allowHashBang: false,
  // By default, the parser will verify that private properties are
  // only used in places where they are valid and have been declared.
  // Set this to false to turn such checks off.
  checkPrivateFields: true,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // Pass an optional `{line, column}` object to use for the start of
  // the parse. This is mostly useful when using `parseExpressionAt`
  // with `locations: true`, to prevent the parser from having to
  // determine the line position at the start position.
  startLocation: null,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  // When this option has an array as value, objects representing the
  // comments are pushed to it.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false
};
var warnedAboutEcmaVersion = false;
function getOptions(opts) {
  var options = {};
  for (var opt in defaultOptions) {
    options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
  }
  if (options.ecmaVersion === "latest") {
    options.ecmaVersion = 1e8;
  } else if (options.ecmaVersion == null) {
    if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
      warnedAboutEcmaVersion = true;
      console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
    }
    options.ecmaVersion = 11;
  } else if (options.ecmaVersion >= 2015) {
    options.ecmaVersion -= 2009;
  }
  if (options.allowReserved == null) {
    options.allowReserved = options.ecmaVersion < 5;
  }
  if (!opts || opts.allowHashBang == null) {
    options.allowHashBang = options.ecmaVersion >= 14;
  }
  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function(token) {
      return tokens.push(token);
    };
  }
  if (isArray(options.onComment)) {
    options.onComment = pushComment(options, options.onComment);
  }
  if (options.sourceType === "commonjs" && options.allowAwaitOutsideFunction) {
    throw new Error("Cannot use allowAwaitOutsideFunction with sourceType: commonjs");
  }
  return options;
}
function pushComment(options, array) {
  return function(block, text2, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text2,
      start,
      end
    };
    if (options.locations) {
      comment.loc = new SourceLocation(this, startLoc, endLoc);
    }
    if (options.ranges) {
      comment.range = [start, end];
    }
    array.push(comment);
  };
}
var SCOPE_TOP = 1;
var SCOPE_FUNCTION = 2;
var SCOPE_ASYNC = 4;
var SCOPE_GENERATOR = 8;
var SCOPE_ARROW = 16;
var SCOPE_SIMPLE_CATCH = 32;
var SCOPE_SUPER = 64;
var SCOPE_DIRECT_SUPER = 128;
var SCOPE_CLASS_STATIC_BLOCK = 256;
var SCOPE_CLASS_FIELD_INIT = 512;
var SCOPE_SWITCH = 1024;
var SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;
function functionFlags(async, generator) {
  return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0);
}
var BIND_NONE = 0;
var BIND_VAR = 1;
var BIND_LEXICAL = 2;
var BIND_FUNCTION = 3;
var BIND_SIMPLE_CATCH = 4;
var BIND_OUTSIDE = 5;
var Parser = function Parser2(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
  var reserved = "";
  if (options.allowReserved !== true) {
    reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
    if (options.sourceType === "module") {
      reserved += " await";
    }
  }
  this.reservedWords = wordsRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = wordsRegexp(reservedStrict);
  this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);
  this.containsEsc = false;
  this.pos = startPos || 0;
  this.curLine = 1;
  if (options.startLocation) {
    this.lineStart = this.pos - options.startLocation.column;
    this.curLine = options.startLocation.line;
  } else if (startPos) {
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    if (this.options.locations) {
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
    }
  } else {
    this.lineStart = 0;
  }
  this.type = types$1.eof;
  this.value = null;
  this.start = this.end = this.pos;
  this.startLoc = this.endLoc = this.curPosition();
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;
  this.context = this.initialContext();
  this.exprAllowed = true;
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || options.strict === true || this.strictDirective(this.pos);
  this.potentialArrowAt = -1;
  this.potentialArrowInForAwait = false;
  this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
  this.labels = [];
  this.undefinedExports = /* @__PURE__ */ Object.create(null);
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!") {
    this.skipLineComment(2);
  }
  this.scopeStack = [];
  this.enterScope(
    this.options.sourceType === "commonjs" ? SCOPE_FUNCTION : SCOPE_TOP
  );
  this.regexpState = null;
  this.privateNameStack = [];
};
var prototypeAccessors = { inFunction: { configurable: true }, inGenerator: { configurable: true }, inAsync: { configurable: true }, canAwait: { configurable: true }, allowReturn: { configurable: true }, allowSuper: { configurable: true }, allowDirectSuper: { configurable: true }, treatFunctionsAsVar: { configurable: true }, allowNewDotTarget: { configurable: true }, allowUsing: { configurable: true }, inClassStaticBlock: { configurable: true } };
Parser.prototype.parse = function parse() {
  var this$1$1 = this;
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.catchStackOverflow(function() {
    return this$1$1.parseTopLevel(node);
  });
};
prototypeAccessors.inFunction.get = function() {
  return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
};
prototypeAccessors.inGenerator.get = function() {
  return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0;
};
prototypeAccessors.inAsync.get = function() {
  return (this.currentVarScope().flags & SCOPE_ASYNC) > 0;
};
prototypeAccessors.canAwait.get = function() {
  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
    var ref2 = this.scopeStack[i];
    var flags = ref2.flags;
    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) {
      return false;
    }
    if (flags & SCOPE_FUNCTION) {
      return (flags & SCOPE_ASYNC) > 0;
    }
  }
  return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
};
prototypeAccessors.allowReturn.get = function() {
  if (this.inFunction) {
    return true;
  }
  if (this.options.allowReturnOutsideFunction && this.currentVarScope().flags & SCOPE_TOP) {
    return true;
  }
  return false;
};
prototypeAccessors.allowSuper.get = function() {
  var ref2 = this.currentThisScope();
  var flags = ref2.flags;
  return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod;
};
prototypeAccessors.allowDirectSuper.get = function() {
  return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
};
prototypeAccessors.treatFunctionsAsVar.get = function() {
  return this.treatFunctionsAsVarInScope(this.currentScope());
};
prototypeAccessors.allowNewDotTarget.get = function() {
  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
    var ref2 = this.scopeStack[i];
    var flags = ref2.flags;
    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) || flags & SCOPE_FUNCTION && !(flags & SCOPE_ARROW)) {
      return true;
    }
  }
  return false;
};
prototypeAccessors.allowUsing.get = function() {
  var ref2 = this.currentScope();
  var flags = ref2.flags;
  if (flags & SCOPE_SWITCH) {
    return false;
  }
  if (!this.inModule && flags & SCOPE_TOP) {
    return false;
  }
  return true;
};
prototypeAccessors.inClassStaticBlock.get = function() {
  return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
};
Parser.extend = function extend() {
  var plugins = [], len = arguments.length;
  while (len--) plugins[len] = arguments[len];
  var cls = this;
  for (var i = 0; i < plugins.length; i++) {
    cls = plugins[i](cls);
  }
  return cls;
};
Parser.parse = function parse2(input, options) {
  return new this(options, input).parse();
};
Parser.parseExpressionAt = function parseExpressionAt(input, pos, options) {
  var parser = new this(options, input, pos);
  parser.nextToken();
  return parser.parseExpression();
};
Parser.tokenizer = function tokenizer(input, options) {
  return new this(options, input);
};
Object.defineProperties(Parser.prototype, prototypeAccessors);
var pp$9 = Parser.prototype;
var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
pp$9.strictDirective = function(start) {
  if (this.options.ecmaVersion < 5) {
    return false;
  }
  for (; ; ) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    var match = literal.exec(this.input.slice(start));
    if (!match) {
      return false;
    }
    if ((match[1] || match[2]) === "use strict") {
      skipWhiteSpace.lastIndex = start + match[0].length;
      var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
      var next = this.input.charAt(end);
      return next === ";" || next === "}" || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "=" || next === "i" && keywordOpAt(this, end));
    }
    start += match[0].length;
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    if (this.input[start] === ";") {
      start++;
    }
  }
};
function keywordOpAt(parser, pos) {
  var end = pos + 1, stop = Math.min(parser.input.length, pos + 11);
  while (end < stop) {
    var ch = parser.fullCharCodeAt(end);
    if (!isIdentifierChar(ch, true)) {
      break;
    }
    end += ch <= 65535 ? 1 : 2;
  }
  return end === pos + 2 && parser.input.slice(pos, end) === "in" || end === pos + 10 && parser.input.slice(pos, end) === "instanceof";
}
pp$9.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true;
  } else {
    return false;
  }
};
pp$9.isContextual = function(name) {
  return this.type === types$1.name && this.value === name && !this.containsEsc;
};
pp$9.eatContextual = function(name) {
  if (!this.isContextual(name)) {
    return false;
  }
  this.next();
  return true;
};
pp$9.catchStackOverflow = function(f) {
  try {
    return f();
  } catch (e) {
    if (e instanceof Error && (/\bstack\b.*\b(exceeded|overflow)\b/i.test(e.message) || /\btoo much recursion\b/i.test(e.message))) {
      this.raise(this.start, "Not enough stack space to parse input");
    } else {
      throw e;
    }
  }
};
pp$9.expectContextual = function(name) {
  if (!this.eatContextual(name)) {
    this.unexpected();
  }
};
pp$9.canInsertSemicolon = function() {
  return this.type === types$1.eof || this.type === types$1.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$9.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon) {
      this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
    }
    return true;
  }
};
pp$9.semicolon = function() {
  if (!this.eat(types$1.semi) && !this.insertSemicolon()) {
    this.unexpected();
  }
};
pp$9.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma) {
      this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
    }
    if (!notNext) {
      this.next();
    }
    return true;
  }
};
pp$9.expect = function(type) {
  this.eat(type) || this.unexpected();
};
pp$9.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};
var DestructuringErrors = function DestructuringErrors2() {
  this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
};
pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) {
    return;
  }
  if (refDestructuringErrors.trailingComma > -1) {
    this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element");
  }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) {
    this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern");
  }
};
pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) {
    return false;
  }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) {
    return shorthandAssign >= 0 || doubleProto >= 0;
  }
  if (shorthandAssign >= 0) {
    this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns");
  }
  if (doubleProto >= 0) {
    this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property");
  }
};
pp$9.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos)) {
    this.raise(this.yieldPos, "Yield expression cannot be a default value");
  }
  if (this.awaitPos) {
    this.raise(this.awaitPos, "Await expression cannot be a default value");
  }
};
pp$9.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression") {
    return this.isSimpleAssignTarget(expr.expression);
  }
  return expr.type === "Identifier" || expr.type === "MemberExpression";
};
var pp$8 = Parser.prototype;
pp$8.parseTopLevel = function(node) {
  var exports$1 = /* @__PURE__ */ Object.create(null);
  if (!node.body) {
    node.body = [];
  }
  while (this.type !== types$1.eof) {
    var stmt = this.parseStatement(null, true, exports$1);
    node.body.push(stmt);
  }
  if (this.inModule) {
    for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1) {
      var name = list[i];
      this.raiseRecoverable(this.undefinedExports[name].start, "Export '" + name + "' is not defined");
    }
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  node.sourceType = this.options.sourceType === "commonjs" ? "script" : this.options.sourceType;
  return this.finishNode(node, "Program");
};
var loopLabel = { kind: "loop" };
var switchLabel = { kind: "switch" };
pp$8.isLet = function(context) {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.fullCharCodeAt(next);
  if (nextCh === 91 || nextCh === 92) {
    return true;
  }
  if (context) {
    return false;
  }
  if (nextCh === 123) {
    return true;
  }
  if (isIdentifierStart(nextCh)) {
    var start = next;
    do {
      next += nextCh <= 65535 ? 1 : 2;
    } while (isIdentifierChar(nextCh = this.fullCharCodeAt(next)));
    if (nextCh === 92) {
      return true;
    }
    var ident = this.input.slice(start, next);
    if (!keywordRelationalOperator.test(ident)) {
      return true;
    }
  }
  return false;
};
pp$8.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, after;
  return !lineBreak.test(this.input.slice(this.pos, next)) && this.input.slice(next, next + 8) === "function" && (next + 8 === this.input.length || !(isIdentifierChar(after = this.fullCharCodeAt(next + 8)) || after === 92));
};
pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
  if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  if (lineBreak.test(this.input.slice(this.pos, next))) {
    return false;
  }
  if (isAwaitUsing) {
    var usingEndPos = next + 5, after;
    if (this.input.slice(next, usingEndPos) !== "using" || usingEndPos === this.input.length || isIdentifierChar(after = this.fullCharCodeAt(usingEndPos)) || after === 92) {
      return false;
    }
    skipWhiteSpace.lastIndex = usingEndPos;
    var skipAfterUsing = skipWhiteSpace.exec(this.input);
    next = usingEndPos + skipAfterUsing[0].length;
    if (skipAfterUsing && lineBreak.test(this.input.slice(usingEndPos, next))) {
      return false;
    }
  }
  var ch = this.fullCharCodeAt(next);
  if (!isIdentifierStart(ch) && ch !== 92) {
    return false;
  }
  var idStart = next;
  do {
    next += ch <= 65535 ? 1 : 2;
  } while (isIdentifierChar(ch = this.fullCharCodeAt(next)));
  if (ch === 92) {
    return true;
  }
  var id = this.input.slice(idStart, next);
  if (keywordRelationalOperator.test(id)) {
    return false;
  }
  if (isFor && !isAwaitUsing && id === "of") {
    skipWhiteSpace.lastIndex = next;
    var skipAfterOf = skipWhiteSpace.exec(this.input);
    next = next + skipAfterOf[0].length;
    if (this.input.charCodeAt(next) !== 61 || // Check for ==, === and => operators
    (ch = this.input.charCodeAt(next + 1)) === 61 || ch === 62) {
      return false;
    }
  }
  return true;
};
pp$8.isAwaitUsing = function(isFor) {
  return this.isUsingKeyword(true, isFor);
};
pp$8.isUsing = function(isFor) {
  return this.isUsingKeyword(false, isFor);
};
pp$8.parseStatement = function(context, topLevel, exports$1) {
  var starttype = this.type, node = this.startNode(), kind;
  if (this.isLet(context)) {
    starttype = types$1._var;
    kind = "let";
  }
  switch (starttype) {
    case types$1._break:
    case types$1._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case types$1._debugger:
      return this.parseDebuggerStatement(node);
    case types$1._do:
      return this.parseDoStatement(node);
    case types$1._for:
      return this.parseForStatement(node);
    case types$1._function:
      if (context && (this.strict || context !== "if" && context !== "label") && this.options.ecmaVersion >= 6) {
        this.unexpected();
      }
      return this.parseFunctionStatement(node, false, !context);
    case types$1._class:
      if (context) {
        this.unexpected();
      }
      return this.parseClass(node, true);
    case types$1._if:
      return this.parseIfStatement(node);
    case types$1._return:
      return this.parseReturnStatement(node);
    case types$1._switch:
      return this.parseSwitchStatement(node);
    case types$1._throw:
      return this.parseThrowStatement(node);
    case types$1._try:
      return this.parseTryStatement(node);
    case types$1._const:
    case types$1._var:
      kind = kind || this.value;
      if (context && kind !== "var") {
        this.unexpected();
      }
      return this.parseVarStatement(node, kind);
    case types$1._while:
      return this.parseWhileStatement(node);
    case types$1._with:
      return this.parseWithStatement(node);
    case types$1.braceL:
      return this.parseBlock(true, node);
    case types$1.semi:
      return this.parseEmptyStatement(node);
    case types$1._export:
    case types$1._import:
      if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40 || nextCh === 46) {
          return this.parseExpressionStatement(node, this.parseExpression());
        }
      }
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) {
          this.raise(this.start, "'import' and 'export' may only appear at the top level");
        }
        if (!this.inModule) {
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
        }
      }
      return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports$1);
    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction()) {
        if (context) {
          this.unexpected();
        }
        this.next();
        return this.parseFunctionStatement(node, true, !context);
      }
      var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
      if (usingKind) {
        if (!this.allowUsing) {
          this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script` or in the bare case statement");
        }
        if (context) {
          this.raise(this.start, "Using declaration is not allowed in single-statement positions");
        }
        if (usingKind === "await using") {
          if (!this.canAwait) {
            this.raise(this.start, "Await using cannot appear outside of async function");
          }
          this.next();
        }
        this.next();
        this.parseVar(node, false, usingKind);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration");
      }
      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon)) {
        return this.parseLabeledStatement(node, maybeName, expr, context);
      } else {
        return this.parseExpressionStatement(node, expr);
      }
  }
};
pp$8.parseBreakContinueStatement = function(node, keyword) {
  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.label = null;
  } else if (this.type !== types$1.name) {
    this.unexpected();
  } else {
    node.label = this.parseIdent();
    this.semicolon();
  }
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) {
        break;
      }
      if (node.label && isBreak) {
        break;
      }
    }
  }
  if (i === this.labels.length) {
    this.raise(node.start, "Unsyntactic " + keyword);
  }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};
pp$8.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};
pp$8.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("do");
  this.labels.pop();
  this.expect(types$1._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6) {
    this.eat(types$1.semi);
  } else {
    this.semicolon();
  }
  return this.finishNode(node, "DoWhileStatement");
};
pp$8.parseForStatement = function(node) {
  this.next();
  var awaitAt = this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await") ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterScope(0);
  this.expect(types$1.parenL);
  if (this.type === types$1.semi) {
    if (awaitAt > -1) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, null);
  }
  var isLet = this.isLet();
  if (this.type === types$1._var || this.type === types$1._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    return this.parseForAfterInit(node, init$1, awaitAt);
  }
  var startsWithLet = this.isContextual("let"), isForOf = false;
  var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
  if (usingKind) {
    var init$2 = this.startNode();
    this.next();
    if (usingKind === "await using") {
      if (!this.canAwait) {
        this.raise(this.start, "Await using cannot appear outside of async function");
      }
      this.next();
    }
    this.parseVar(init$2, true, usingKind);
    this.finishNode(init$2, "VariableDeclaration");
    return this.parseForAfterInit(node, init$2, awaitAt);
  }
  var containsEsc = this.containsEsc;
  var refDestructuringErrors = new DestructuringErrors();
  var initPos = this.start;
  var init = awaitAt > -1 ? this.parseExprSubscripts(refDestructuringErrors, "await") : this.parseExpression(true, refDestructuringErrors);
  if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (awaitAt > -1) {
      if (this.type === types$1._in) {
        this.unexpected(awaitAt);
      }
      node.await = true;
    } else if (isForOf && this.options.ecmaVersion >= 8) {
      if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") {
        this.unexpected();
      } else if (this.options.ecmaVersion >= 9) {
        node.await = false;
      }
    }
    if (startsWithLet && isForOf) {
      this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'.");
    }
    this.toAssignable(init, false, refDestructuringErrors);
    this.checkLValPattern(init);
    return this.parseForIn(node, init);
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) {
    this.unexpected(awaitAt);
  }
  return this.parseFor(node, init);
};
pp$8.parseForAfterInit = function(node, init, awaitAt) {
  if ((this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && init.declarations.length === 1) {
    if (this.type === types$1._in) {
      if ((init.kind === "using" || init.kind === "await using") && !init.declarations[0].init) {
        this.raise(this.start, "Using declaration is not allowed in for-in loops");
      }
      if (this.options.ecmaVersion >= 9 && awaitAt > -1) {
        this.unexpected(awaitAt);
      }
    } else if (this.options.ecmaVersion >= 9) {
      node.await = awaitAt > -1;
    }
    return this.parseForIn(node, init);
  }
  if (awaitAt > -1) {
    this.unexpected(awaitAt);
  }
  return this.parseFor(node, init);
};
pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
  this.next();
  return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync);
};
pp$8.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement("if");
  node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
  return this.finishNode(node, "IfStatement");
};
pp$8.parseReturnStatement = function(node) {
  if (!this.allowReturn) {
    this.raise(this.start, "'return' outside of function");
  }
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.argument = null;
  } else {
    node.argument = this.parseExpression();
    this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};
pp$8.parseSwitchStatement = function(node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types$1.braceL);
  this.labels.push(switchLabel);
  this.enterScope(SCOPE_SWITCH);
  var cur;
  for (var sawDefault = false; this.type !== types$1.braceR; ) {
    if (this.type === types$1._case || this.type === types$1._default) {
      var isCase = this.type === types$1._case;
      if (cur) {
        this.finishNode(cur, "SwitchCase");
      }
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) {
          this.raiseRecoverable(this.lastTokStart, "Multiple default clauses");
        }
        sawDefault = true;
        cur.test = null;
      }
      this.expect(types$1.colon);
    } else {
      if (!cur) {
        this.unexpected();
      }
      cur.consequent.push(this.parseStatement(null));
    }
  }
  this.exitScope();
  if (cur) {
    this.finishNode(cur, "SwitchCase");
  }
  this.next();
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};
pp$8.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) {
    this.raise(this.lastTokEnd, "Illegal newline after throw");
  }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};
var empty$1 = [];
pp$8.parseCatchClauseParam = function() {
  var param = this.parseBindingAtom();
  var simple = param.type === "Identifier";
  this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
  this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
  this.expect(types$1.parenR);
  return param;
};
pp$8.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types$1._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types$1.parenL)) {
      clause.param = this.parseCatchClauseParam();
    } else {
      if (this.options.ecmaVersion < 10) {
        this.unexpected();
      }
      clause.param = null;
      this.enterScope(0);
    }
    clause.body = this.parseBlock(false);
    this.exitScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) {
    this.raise(node.start, "Missing catch or finally clause");
  }
  return this.finishNode(node, "TryStatement");
};
pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
  this.next();
  this.parseVar(node, false, kind, allowMissingInitializer);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};
pp$8.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("while");
  this.labels.pop();
  return this.finishNode(node, "WhileStatement");
};
pp$8.parseWithStatement = function(node) {
  if (this.strict) {
    this.raise(this.start, "'with' in strict mode");
  }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement("with");
  return this.finishNode(node, "WithStatement");
};
pp$8.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};
pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
  for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1) {
    var label = list[i$1];
    if (label.name === maybeName) {
      this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
  }
  var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this.labels[i];
    if (label$1.statementStart === node.start) {
      label$1.statementStart = this.start;
      label$1.kind = kind;
    } else {
      break;
    }
  }
  this.labels.push({ name: maybeName, kind, statementStart: this.start });
  node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};
pp$8.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};
pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
  if (createNewLexicalScope === void 0) createNewLexicalScope = true;
  if (node === void 0) node = this.startNode();
  node.body = [];
  this.expect(types$1.braceL);
  if (createNewLexicalScope) {
    this.enterScope(0);
  }
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  if (exitStrict) {
    this.strict = false;
  }
  this.next();
  if (createNewLexicalScope) {
    this.exitScope();
  }
  return this.finishNode(node, "BlockStatement");
};
pp$8.parseFor = function(node, init) {
  node.init = init;
  this.expect(types$1.semi);
  node.test = this.type === types$1.semi ? null : this.parseExpression();
  this.expect(types$1.semi);
  node.update = this.type === types$1.parenR ? null : this.parseExpression();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, "ForStatement");
};
pp$8.parseForIn = function(node, init) {
  var isForIn = this.type === types$1._in;
  this.next();
  if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || this.options.ecmaVersion < 8 || this.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
    this.raise(
      init.start,
      (isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer"
    );
  }
  node.left = init;
  node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
};
pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
  node.declarations = [];
  node.kind = kind;
  for (; ; ) {
    var decl = this.startNode();
    this.parseVarId(decl, kind);
    if (this.eat(types$1.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.unexpected();
    } else if (!allowMissingInitializer && (kind === "using" || kind === "await using") && this.options.ecmaVersion >= 17 && this.type !== types$1._in && !this.isContextual("of")) {
      this.raise(this.lastTokEnd, "Missing initializer in " + kind + " declaration");
    } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(types$1.comma)) {
      break;
    }
  }
  return node;
};
pp$8.parseVarId = function(decl, kind) {
  decl.id = kind === "using" || kind === "await using" ? this.parseIdent() : this.parseBindingAtom();
  this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
};
var FUNC_STATEMENT = 1;
var FUNC_HANGING_STATEMENT = 2;
var FUNC_NULLABLE_ID = 4;
pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
    if (this.type === types$1.star && statement & FUNC_HANGING_STATEMENT) {
      this.unexpected();
    }
    node.generator = this.eat(types$1.star);
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  if (statement & FUNC_STATEMENT) {
    node.id = statement & FUNC_NULLABLE_ID && this.type !== types$1.name ? null : this.parseIdent();
    if (node.id && !(statement & FUNC_HANGING_STATEMENT)) {
      this.checkLValSimple(node.id, this.strict || node.generator || node.async ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION);
    }
  }
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(node.async, node.generator));
  if (!(statement & FUNC_STATEMENT)) {
    node.id = this.type === types$1.name ? this.parseIdent() : null;
  }
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, statement & FUNC_STATEMENT ? "FunctionDeclaration" : "FunctionExpression");
};
pp$8.parseFunctionParams = function(node) {
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};
pp$8.parseClass = function(node, isStatement) {
  this.next();
  var oldStrict = this.strict;
  this.strict = true;
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var privateNameMap = this.enterClassBody();
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types$1.braceL);
  while (this.type !== types$1.braceR) {
    var element = this.parseClassElement(node.superClass !== null);
    if (element) {
      classBody.body.push(element);
      if (element.type === "MethodDefinition" && element.kind === "constructor") {
        if (hadConstructor) {
          this.raiseRecoverable(element.start, "Duplicate constructor in the same class");
        }
        hadConstructor = true;
      } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
        this.raiseRecoverable(element.key.start, "Identifier '#" + element.key.name + "' has already been declared");
      }
    }
  }
  this.strict = oldStrict;
  this.next();
  node.body = this.finishNode(classBody, "ClassBody");
  this.exitClassBody();
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};
pp$8.parseClassElement = function(constructorAllowsSuper) {
  if (this.eat(types$1.semi)) {
    return null;
  }
  var ecmaVersion = this.options.ecmaVersion;
  var node = this.startNode();
  var keyName = "";
  var isGenerator = false;
  var isAsync = false;
  var kind = "method";
  var isStatic = false;
  if (this.eatContextual("static")) {
    if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
      this.parseClassStaticBlock(node);
      return node;
    }
    if (this.isClassElementNameStart() || this.type === types$1.star) {
      isStatic = true;
    } else {
      keyName = "static";
    }
  }
  node.static = isStatic;
  if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
    if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
      isAsync = true;
    } else {
      keyName = "async";
    }
  }
  if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
    isGenerator = true;
  }
  if (!keyName && !isAsync && !isGenerator) {
    var lastValue = this.value;
    if (this.eatContextual("get") || this.eatContextual("set")) {
      if (this.isClassElementNameStart()) {
        kind = lastValue;
      } else {
        keyName = lastValue;
      }
    }
  }
  if (keyName) {
    node.computed = false;
    node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
    node.key.name = keyName;
    this.finishNode(node.key, "Identifier");
  } else {
    this.parseClassElementName(node);
  }
  if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
    var isConstructor = !node.static && checkKeyName(node, "constructor");
    var allowsDirectSuper = isConstructor && constructorAllowsSuper;
    if (isConstructor && kind !== "method") {
      this.raise(node.key.start, "Constructor can't have get/set modifier");
    }
    node.kind = isConstructor ? "constructor" : kind;
    this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
  } else {
    this.parseClassField(node);
  }
  return node;
};
pp$8.isClassElementNameStart = function() {
  return this.type === types$1.name || this.type === types$1.privateId || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword;
};
pp$8.parseClassElementName = function(element) {
  if (this.type === types$1.privateId) {
    if (this.value === "constructor") {
      this.raise(this.start, "Classes can't have an element named '#constructor'");
    }
    element.computed = false;
    element.key = this.parsePrivateIdent();
  } else {
    this.parsePropertyName(element);
  }
};
pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
  var key = method.key;
  if (method.kind === "constructor") {
    if (isGenerator) {
      this.raise(key.start, "Constructor can't be a generator");
    }
    if (isAsync) {
      this.raise(key.start, "Constructor can't be an async method");
    }
  } else if (method.static && checkKeyName(method, "prototype")) {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
  if (method.kind === "get" && value.params.length !== 0) {
    this.raiseRecoverable(value.start, "getter should have no params");
  }
  if (method.kind === "set" && value.params.length !== 1) {
    this.raiseRecoverable(value.start, "setter should have exactly one param");
  }
  if (method.kind === "set" && value.params[0].type === "RestElement") {
    this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params");
  }
  return this.finishNode(method, "MethodDefinition");
};
pp$8.parseClassField = function(field) {
  if (checkKeyName(field, "constructor")) {
    this.raise(field.key.start, "Classes can't have a field named 'constructor'");
  } else if (field.static && checkKeyName(field, "prototype")) {
    this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
  }
  if (this.eat(types$1.eq)) {
    this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
    field.value = this.parseMaybeAssign();
    this.exitScope();
  } else {
    field.value = null;
  }
  this.semicolon();
  return this.finishNode(field, "PropertyDefinition");
};
pp$8.parseClassStaticBlock = function(node) {
  node.body = [];
  var oldLabels = this.labels;
  this.labels = [];
  this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  this.next();
  this.exitScope();
  this.labels = oldLabels;
  return this.finishNode(node, "StaticBlock");
};
pp$8.parseClassId = function(node, isStatement) {
  if (this.type === types$1.name) {
    node.id = this.parseIdent();
    if (isStatement) {
      this.checkLValSimple(node.id, BIND_LEXICAL, false);
    }
  } else {
    if (isStatement === true) {
      this.unexpected();
    }
    node.id = null;
  }
};
pp$8.parseClassSuper = function(node) {
  node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
};
pp$8.enterClassBody = function() {
  var element = { declared: /* @__PURE__ */ Object.create(null), used: [] };
  this.privateNameStack.push(element);
  return element.declared;
};
pp$8.exitClassBody = function() {
  var ref2 = this.privateNameStack.pop();
  var declared = ref2.declared;
  var used = ref2.used;
  if (!this.options.checkPrivateFields) {
    return;
  }
  var len = this.privateNameStack.length;
  var parent = len === 0 ? null : this.privateNameStack[len - 1];
  for (var i = 0; i < used.length; ++i) {
    var id = used[i];
    if (!hasOwn(declared, id.name)) {
      if (parent) {
        parent.used.push(id);
      } else {
        this.raiseRecoverable(id.start, "Private field '#" + id.name + "' must be declared in an enclosing class");
      }
    }
  }
};
function isPrivateNameConflicted(privateNameMap, element) {
  var name = element.key.name;
  var curr = privateNameMap[name];
  var next = "true";
  if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
    next = (element.static ? "s" : "i") + element.kind;
  }
  if (curr === "iget" && next === "iset" || curr === "iset" && next === "iget" || curr === "sget" && next === "sset" || curr === "sset" && next === "sget") {
    privateNameMap[name] = "true";
    return false;
  } else if (!curr) {
    privateNameMap[name] = next;
    return false;
  } else {
    return true;
  }
}
function checkKeyName(node, name) {
  var computed = node.computed;
  var key = node.key;
  return !computed && (key.type === "Identifier" && key.name === name || key.type === "Literal" && key.value === name);
}
pp$8.parseExportAllDeclaration = function(node, exports$1) {
  if (this.options.ecmaVersion >= 11) {
    if (this.eatContextual("as")) {
      node.exported = this.parseModuleExportName();
      this.checkExport(exports$1, node.exported, this.lastTokStart);
    } else {
      node.exported = null;
    }
  }
  this.expectContextual("from");
  if (this.type !== types$1.string) {
    this.unexpected();
  }
  node.source = this.parseExprAtom();
  if (this.options.ecmaVersion >= 16) {
    node.attributes = this.parseWithClause();
  }
  this.semicolon();
  return this.finishNode(node, "ExportAllDeclaration");
};
pp$8.parseExport = function(node, exports$1) {
  this.next();
  if (this.eat(types$1.star)) {
    return this.parseExportAllDeclaration(node, exports$1);
  }
  if (this.eat(types$1._default)) {
    this.checkExport(exports$1, "default", this.lastTokStart);
    node.declaration = this.parseExportDefaultDeclaration();
    return this.finishNode(node, "ExportDefaultDeclaration");
  }
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseExportDeclaration(node);
    if (node.declaration.type === "VariableDeclaration") {
      this.checkVariableExport(exports$1, node.declaration.declarations);
    } else {
      this.checkExport(exports$1, node.declaration.id, node.declaration.id.start);
    }
    node.specifiers = [];
    node.source = null;
    if (this.options.ecmaVersion >= 16) {
      node.attributes = [];
    }
  } else {
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports$1);
    if (this.eatContextual("from")) {
      if (this.type !== types$1.string) {
        this.unexpected();
      }
      node.source = this.parseExprAtom();
      if (this.options.ecmaVersion >= 16) {
        node.attributes = this.parseWithClause();
      }
    } else {
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];
        this.checkUnreserved(spec.local);
        this.checkLocalExport(spec.local);
        if (spec.local.type === "Literal") {
          this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
        }
      }
      node.source = null;
      if (this.options.ecmaVersion >= 16) {
        node.attributes = [];
      }
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration");
};
pp$8.parseExportDeclaration = function(node) {
  return this.parseStatement(null);
};
pp$8.parseExportDefaultDeclaration = function() {
  var isAsync;
  if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
    var fNode = this.startNode();
    this.next();
    if (isAsync) {
      this.next();
    }
    return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
  } else if (this.type === types$1._class) {
    var cNode = this.startNode();
    return this.parseClass(cNode, "nullableID");
  } else {
    var declaration = this.parseMaybeAssign();
    this.semicolon();
    return declaration;
  }
};
pp$8.checkExport = function(exports$1, name, pos) {
  if (!exports$1) {
    return;
  }
  if (typeof name !== "string") {
    name = name.type === "Identifier" ? name.name : name.value;
  }
  if (hasOwn(exports$1, name)) {
    this.raiseRecoverable(pos, "Duplicate export '" + name + "'");
  }
  exports$1[name] = true;
};
pp$8.checkPatternExport = function(exports$1, pat) {
  var type = pat.type;
  if (type === "Identifier") {
    this.checkExport(exports$1, pat, pat.start);
  } else if (type === "ObjectPattern") {
    for (var i = 0, list = pat.properties; i < list.length; i += 1) {
      var prop = list[i];
      this.checkPatternExport(exports$1, prop);
    }
  } else if (type === "ArrayPattern") {
    for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];
      if (elt) {
        this.checkPatternExport(exports$1, elt);
      }
    }
  } else if (type === "Property") {
    this.checkPatternExport(exports$1, pat.value);
  } else if (type === "AssignmentPattern") {
    this.checkPatternExport(exports$1, pat.left);
  } else if (type === "RestElement") {
    this.checkPatternExport(exports$1, pat.argument);
  }
};
pp$8.checkVariableExport = function(exports$1, decls) {
  if (!exports$1) {
    return;
  }
  for (var i = 0, list = decls; i < list.length; i += 1) {
    var decl = list[i];
    this.checkPatternExport(exports$1, decl.id);
  }
};
pp$8.shouldParseExportStatement = function() {
  return this.type.keyword === "var" || this.type.keyword === "const" || this.type.keyword === "class" || this.type.keyword === "function" || this.isLet() || this.isAsyncFunction();
};
pp$8.parseExportSpecifier = function(exports$1) {
  var node = this.startNode();
  node.local = this.parseModuleExportName();
  node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
  this.checkExport(
    exports$1,
    node.exported,
    node.exported.start
  );
  return this.finishNode(node, "ExportSpecifier");
};
pp$8.parseExportSpecifiers = function(exports$1) {
  var nodes = [], first = true;
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseExportSpecifier(exports$1));
  }
  return nodes;
};
pp$8.parseImport = function(node) {
  this.next();
  if (this.type === types$1.string) {
    node.specifiers = empty$1;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
  }
  if (this.options.ecmaVersion >= 16) {
    node.attributes = this.parseWithClause();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};
pp$8.parseImportSpecifier = function() {
  var node = this.startNode();
  node.imported = this.parseModuleExportName();
  if (this.eatContextual("as")) {
    node.local = this.parseIdent();
  } else {
    this.checkUnreserved(node.imported);
    node.local = node.imported;
  }
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportSpecifier");
};
pp$8.parseImportDefaultSpecifier = function() {
  var node = this.startNode();
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportDefaultSpecifier");
};
pp$8.parseImportNamespaceSpecifier = function() {
  var node = this.startNode();
  this.next();
  this.expectContextual("as");
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportNamespaceSpecifier");
};
pp$8.parseImportSpecifiers = function() {
  var nodes = [], first = true;
  if (this.type === types$1.name) {
    nodes.push(this.parseImportDefaultSpecifier());
    if (!this.eat(types$1.comma)) {
      return nodes;
    }
  }
  if (this.type === types$1.star) {
    nodes.push(this.parseImportNamespaceSpecifier());
    return nodes;
  }
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseImportSpecifier());
  }
  return nodes;
};
pp$8.parseWithClause = function() {
  var nodes = [];
  if (!this.eat(types$1._with)) {
    return nodes;
  }
  this.expect(types$1.braceL);
  var attributeKeys = {};
  var first = true;
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    var attr = this.parseImportAttribute();
    var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
    if (hasOwn(attributeKeys, keyName)) {
      this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'");
    }
    attributeKeys[keyName] = true;
    nodes.push(attr);
  }
  return nodes;
};
pp$8.parseImportAttribute = function() {
  var node = this.startNode();
  node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
  this.expect(types$1.colon);
  if (this.type !== types$1.string) {
    this.unexpected();
  }
  node.value = this.parseExprAtom();
  return this.finishNode(node, "ImportAttribute");
};
pp$8.parseModuleExportName = function() {
  if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
    var stringLiteral = this.parseLiteral(this.value);
    if (loneSurrogate.test(stringLiteral.value)) {
      this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
    }
    return stringLiteral;
  }
  return this.parseIdent(true);
};
pp$8.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$8.isDirectiveCandidate = function(statement) {
  return this.options.ecmaVersion >= 5 && statement.type === "ExpressionStatement" && statement.expression.type === "Literal" && typeof statement.expression.value === "string" && // Reject parenthesized strings.
  (this.input[statement.start] === '"' || this.input[statement.start] === "'");
};
var pp$7 = Parser.prototype;
pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await") {
          this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
        }
        break;
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break;
      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          this.toAssignable(prop, isBinding);
          if (prop.type === "RestElement" && (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")) {
            this.raise(prop.argument.start, "Unexpected token");
          }
        }
        break;
      case "Property":
        if (node.kind !== "init") {
          this.raise(node.key.start, "Object pattern can't contain getter or setter");
        }
        this.toAssignable(node.value, isBinding);
        break;
      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        this.toAssignableList(node.elements, isBinding);
        break;
      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern") {
          this.raise(node.argument.start, "Rest elements cannot have a default value");
        }
        break;
      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
        }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        break;
      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break;
      case "ChainExpression":
        this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
        break;
      case "MemberExpression":
        if (!isBinding) {
          break;
        }
      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) {
    this.checkPatternErrors(refDestructuringErrors, true);
  }
  return node;
};
pp$7.toAssignableList = function(exprList, isBinding) {
  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) {
      this.toAssignable(elt, isBinding);
    }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier") {
      this.unexpected(last.argument.start);
    }
  }
  return exprList;
};
pp$7.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement");
};
pp$7.parseRestBinding = function() {
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion === 6 && this.type !== types$1.name) {
    this.unexpected();
  }
  node.argument = this.parseBindingAtom();
  return this.finishNode(node, "RestElement");
};
pp$7.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
      case types$1.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types$1.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern");
      case types$1.braceL:
        return this.parseObj(true);
    }
  }
  return this.parseIdent();
};
pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) {
      first = false;
    } else {
      this.expect(types$1.comma);
    }
    if (allowEmpty && this.type === types$1.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
      break;
    } else if (this.type === types$1.ellipsis) {
      var rest = this.parseRestBinding();
      this.parseBindingListItem(rest);
      elts.push(rest);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      this.expect(close);
      break;
    } else {
      elts.push(this.parseAssignableListItem(allowModifiers));
    }
  }
  return elts;
};
pp$7.parseAssignableListItem = function(allowModifiers) {
  var elem = this.parseMaybeDefault(this.start, this.startLoc);
  this.parseBindingListItem(elem);
  return elem;
};
pp$7.parseBindingListItem = function(param) {
  return param;
};
pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) {
    return left;
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};
pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  var isBind = bindingType !== BIND_NONE;
  switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name)) {
        this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      }
      if (isBind) {
        if (bindingType === BIND_LEXICAL && expr.name === "let") {
          this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name");
        }
        if (checkClashes) {
          if (hasOwn(checkClashes, expr.name)) {
            this.raiseRecoverable(expr.start, "Argument name clash");
          }
          checkClashes[expr.name] = true;
        }
        if (bindingType !== BIND_OUTSIDE) {
          this.declareName(expr.name, bindingType, expr.start);
        }
      }
      break;
    case "ChainExpression":
      this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
      break;
    case "MemberExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding member expression");
      }
      break;
    case "ParenthesizedExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding parenthesized expression");
      }
      return this.checkLValSimple(expr.expression, bindingType, checkClashes);
    default:
      this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
  }
};
pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "ObjectPattern":
      for (var i = 0, list = expr.properties; i < list.length; i += 1) {
        var prop = list[i];
        this.checkLValInnerPattern(prop, bindingType, checkClashes);
      }
      break;
    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];
        if (elem) {
          this.checkLValInnerPattern(elem, bindingType, checkClashes);
        }
      }
      break;
    default:
      this.checkLValSimple(expr, bindingType, checkClashes);
  }
};
pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "Property":
      this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
      break;
    case "AssignmentPattern":
      this.checkLValPattern(expr.left, bindingType, checkClashes);
      break;
    case "RestElement":
      this.checkLValPattern(expr.argument, bindingType, checkClashes);
      break;
    default:
      this.checkLValPattern(expr, bindingType, checkClashes);
  }
};
var TokContext = function TokContext2(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function(p) {
    return p.tryReadTemplateToken();
  }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};
var pp$6 = Parser.prototype;
pp$6.initialContext = function() {
  return [types.b_stat];
};
pp$6.curContext = function() {
  return this.context[this.context.length - 1];
};
pp$6.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types.f_expr || parent === types.f_stat) {
    return true;
  }
  if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr)) {
    return !parent.isExpr;
  }
  if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed) {
    return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  }
  if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow) {
    return true;
  }
  if (prevType === types$1.braceL) {
    return parent === types.b_stat;
  }
  if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name) {
    return false;
  }
  return !this.exprAllowed;
};
pp$6.inGeneratorContext = function() {
  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this.context[i];
    if (context.token === "function") {
      return context.generator;
    }
  }
  return false;
};
pp$6.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType === types$1.dot) {
    this.exprAllowed = false;
  } else if (update = type.updateContext) {
    update.call(this, prevType);
  } else {
    this.exprAllowed = type.beforeExpr;
  }
};
pp$6.overrideContext = function(tokenCtx) {
  if (this.curContext() !== tokenCtx) {
    this.context[this.context.length - 1] = tokenCtx;
  }
};
types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return;
  }
  var out = this.context.pop();
  if (out === types.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};
types$1.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.exprAllowed = true;
};
types$1.dollarBraceL.updateContext = function() {
  this.context.push(types.b_tmpl);
  this.exprAllowed = true;
};
types$1.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
  this.context.push(statementParens ? types.p_stat : types.p_expr);
  this.exprAllowed = true;
};
types$1.incDec.updateContext = function() {
};
types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types$1._else && !(prevType === types$1.semi && this.curContext() !== types.p_stat) && !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) && !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat)) {
    this.context.push(types.f_expr);
  } else {
    this.context.push(types.f_stat);
  }
  this.exprAllowed = false;
};
types$1.colon.updateContext = function() {
  if (this.curContext().token === "function") {
    this.context.pop();
  }
  this.exprAllowed = true;
};
types$1.backQuote.updateContext = function() {
  if (this.curContext() === types.q_tmpl) {
    this.context.pop();
  } else {
    this.context.push(types.q_tmpl);
  }
  this.exprAllowed = false;
};
types$1.star.updateContext = function(prevType) {
  if (prevType === types$1._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types.f_expr) {
      this.context[index] = types.f_expr_gen;
    } else {
      this.context[index] = types.f_gen;
    }
  }
  this.exprAllowed = true;
};
types$1.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
    if (this.value === "of" && !this.exprAllowed || this.value === "yield" && this.inGeneratorContext()) {
      allowed = true;
    }
  }
  this.exprAllowed = allowed;
};
var pp$5 = Parser.prototype;
pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement") {
    return;
  }
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) {
    return;
  }
  var key = prop.key;
  var name;
  switch (key.type) {
    case "Identifier":
      name = key.name;
      break;
    case "Literal":
      name = String(key.value);
      break;
    default:
      return;
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors) {
          if (refDestructuringErrors.doubleProto < 0) {
            refDestructuringErrors.doubleProto = key.start;
          }
        } else {
          this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
        }
      }
      propHash.proto = true;
    }
    return;
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition) {
      this.raiseRecoverable(key.start, "Redefinition of property");
    }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};
pp$5.parseExpression = function(forInit, refDestructuringErrors) {
  var this$1$1 = this;
  return this.catchStackOverflow(function() {
    var startPos = this$1$1.start, startLoc = this$1$1.startLoc;
    var expr = this$1$1.parseMaybeAssign(forInit, refDestructuringErrors);
    if (this$1$1.type === types$1.comma) {
      var node = this$1$1.startNodeAt(startPos, startLoc);
      node.expressions = [expr];
      while (this$1$1.eat(types$1.comma)) {
        node.expressions.push(this$1$1.parseMaybeAssign(forInit, refDestructuringErrors));
      }
      return this$1$1.finishNode(node, "SequenceExpression");
    }
    return expr;
  });
};
pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
  if (this.isContextual("yield")) {
    if (this.inGenerator) {
      return this.parseYield(forInit);
    } else {
      this.exprAllowed = false;
    }
  }
  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    oldDoubleProto = refDestructuringErrors.doubleProto;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors();
    ownDestructuringErrors = true;
  }
  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types$1.parenL || this.type === types$1.name) {
    this.potentialArrowAt = this.start;
    this.potentialArrowInForAwait = forInit === "await";
  }
  var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
  if (afterLeftParse) {
    left = afterLeftParse.call(this, left, startPos, startLoc);
  }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    if (this.type === types$1.eq) {
      left = this.toAssignable(left, false, refDestructuringErrors);
    }
    if (!ownDestructuringErrors) {
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
      if (refDestructuringErrors.shorthandAssign >= left.start) {
        refDestructuringErrors.shorthandAssign = -1;
      }
      if (refDestructuringErrors.doubleProto >= left.start) {
        refDestructuringErrors.doubleProto = -1;
      }
    }
    if (this.type === types$1.eq) {
      this.checkLValPattern(left);
    } else {
      this.checkLValSimple(left);
    }
    node.left = left;
    this.next();
    node.right = this.parseMaybeAssign(forInit);
    if (oldDoubleProto > -1) {
      refDestructuringErrors.doubleProto = oldDoubleProto;
    }
    return this.finishNode(node, "AssignmentExpression");
  } else {
    if (ownDestructuringErrors) {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
  }
  if (oldParenAssign > -1) {
    refDestructuringErrors.parenthesizedAssign = oldParenAssign;
  }
  if (oldTrailingComma > -1) {
    refDestructuringErrors.trailingComma = oldTrailingComma;
  }
  return left;
};
pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(forInit, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  if (!(expr.type === "ArrowFunctionExpression" && expr.start === startPos) && this.eat(types$1.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types$1.colon);
    node.alternate = this.parseMaybeAssign(forInit);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};
pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit);
};
pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
  var prec = this.type.binop;
  if (prec != null && (!forInit || this.type !== types$1._in)) {
    if (prec > minPrec) {
      var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
      var coalesce = this.type === types$1.coalesce;
      if (coalesce) {
        prec = types$1.logicalAND.binop;
      }
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
      if (logical && this.type === types$1.coalesce || coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND)) {
        this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
      }
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
    }
  }
  return left;
};
pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  if (right.type === "PrivateIdentifier") {
    this.raise(right.start, "Private identifier can only be left side of binary expression");
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression");
};
pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && this.canAwait) {
    expr = this.parseAwait(forInit);
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types$1.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true, update, forInit);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) {
      this.checkLValSimple(node.argument);
    } else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Deleting local variable in strict mode");
    } else if (node.operator === "delete" && isPrivateFieldAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Private fields can not be deleted");
    } else {
      sawUnary = true;
    }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else if (!sawUnary && this.type === types$1.privateId) {
    if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) {
      this.unexpected();
    }
    expr = this.parsePrivateIdent();
    if (this.type !== types$1._in) {
      this.unexpected();
    }
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) {
      return expr;
    }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.operator = this.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this.checkLValSimple(expr);
      this.next();
      expr = this.finishNode(node$1, "UpdateExpression");
    }
  }
  if (!incDec && !(expr.type === "ArrowFunctionExpression" && expr.start === startPos) && this.eat(types$1.starstar)) {
    if (sawUnary) {
      this.unexpected(this.lastTokStart);
    } else {
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false);
    }
  } else {
    return expr;
  }
};
function isLocalVariableAccess(node) {
  return node.type === "Identifier" || node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression);
}
function isPrivateFieldAccess(node) {
  return node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" || node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) || node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression);
}
pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
  var startPos = this.start, startLoc = this.startLoc;
  var oldDoubleProto = -1, oldShorthandAssign = -1;
  if (refDestructuringErrors) {
    oldDoubleProto = refDestructuringErrors.doubleProto;
    oldShorthandAssign = refDestructuringErrors.shorthandAssign;
    refDestructuringErrors.doubleProto = refDestructuringErrors.shorthandAssign = -1;
  }
  var expr = this.parseExprAtom(refDestructuringErrors, forInit);
  if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")") {
    return expr;
  }
  var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
  if (refDestructuringErrors) {
    if (result.end > expr.end) {
      this.checkExpressionErrors(refDestructuringErrors, true);
      if (refDestructuringErrors.parenthesizedAssign >= result.start) {
        refDestructuringErrors.parenthesizedAssign = -1;
      }
      if (refDestructuringErrors.parenthesizedBind >= result.start) {
        refDestructuringErrors.parenthesizedBind = -1;
      }
      if (refDestructuringErrors.trailingComma >= result.start) {
        refDestructuringErrors.trailingComma = -1;
      }
    }
    if (oldDoubleProto > -1) {
      refDestructuringErrors.doubleProto = oldDoubleProto;
    }
    if (oldShorthandAssign > -1) {
      refDestructuringErrors.shorthandAssign = oldShorthandAssign;
    }
  }
  return result;
};
pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.potentialArrowAt === base.start;
  var optionalChained = false;
  while (true) {
    var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
    if (element.optional) {
      optionalChained = true;
    }
    if (element.end === base.end || element.type === "ArrowFunctionExpression") {
      if (optionalChained) {
        var chainNode = this.startNodeAt(startPos, startLoc);
        chainNode.expression = element;
        element = this.finishNode(chainNode, "ChainExpression");
      }
      return element;
    }
    base = element;
    maybeAsyncArrow = false;
  }
};
pp$5.shouldParseAsyncArrow = function() {
  return !this.canInsertSemicolon() && this.eat(types$1.arrow);
};
pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit);
};
pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
  var optionalSupported = this.options.ecmaVersion >= 11;
  var optional = optionalSupported && this.eat(types$1.questionDot);
  if (noCalls && optional) {
    this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
  }
  var computed = this.eat(types$1.bracketL);
  if (computed || optional && this.type !== types$1.parenL && this.type !== types$1.backQuote || this.eat(types$1.dot)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.object = base;
    if (computed) {
      node.property = this.parseExpression();
      this.expect(types$1.bracketR);
    } else if (this.type === types$1.privateId && base.type !== "Super") {
      node.property = this.parsePrivateIdent();
    } else {
      node.property = this.parseIdent(this.options.allowReserved !== "never");
    }
    node.computed = !!computed;
    if (optionalSupported) {
      node.optional = optional;
    }
    base = this.finishNode(node, "MemberExpression");
  } else if (!noCalls && this.eat(types$1.parenL)) {
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
    if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      if (this.awaitIdentPos > 0) {
        this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function");
      }
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      this.awaitIdentPos = oldAwaitIdentPos;
      return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
    var node$1 = this.startNodeAt(startPos, startLoc);
    node$1.callee = base;
    node$1.arguments = exprList;
    if (optionalSupported) {
      node$1.optional = optional;
    }
    base = this.finishNode(node$1, "CallExpression");
  } else if (this.type === types$1.backQuote) {
    if (optional || optionalChained) {
      this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
    }
    var node$2 = this.startNodeAt(startPos, startLoc);
    node$2.tag = base;
    node$2.quasi = this.parseTemplate({ isTagged: true });
    base = this.finishNode(node$2, "TaggedTemplateExpression");
  }
  return base;
};
pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
  if (this.type === types$1.slash) {
    this.readRegexp();
  }
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
    case types$1._super:
      if (!this.allowSuper) {
        this.raise(this.start, "'super' keyword outside a method");
      }
      node = this.startNode();
      this.next();
      if (this.type === types$1.parenL && !this.allowDirectSuper) {
        this.raise(node.start, "super() call outside constructor of a subclass");
      }
      if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL) {
        this.unexpected();
      }
      return this.finishNode(node, "Super");
    case types$1._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression");
    case types$1.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
        this.overrideContext(types.f_expr);
        return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit);
      }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types$1.arrow)) {
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit);
        }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc && (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types$1.arrow)) {
            this.unexpected();
          }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit);
        }
      }
      return id;
    case types$1.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;
    case types$1.num:
    case types$1.string:
      return this.parseLiteral(this.value);
    case types$1._null:
    case types$1._true:
    case types$1._false:
      node = this.startNode();
      node.value = this.type === types$1._null ? null : this.type === types$1._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");
    case types$1.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr)) {
          refDestructuringErrors.parenthesizedAssign = start;
        }
        if (refDestructuringErrors.parenthesizedBind < 0) {
          refDestructuringErrors.parenthesizedBind = start;
        }
      }
      return expr;
    case types$1.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression");
    case types$1.braceL:
      this.overrideContext(types.b_expr);
      return this.parseObj(false, refDestructuringErrors);
    case types$1._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0);
    case types$1._class:
      return this.parseClass(this.startNode(), false);
    case types$1._new:
      return this.parseNew();
    case types$1.backQuote:
      return this.parseTemplate();
    case types$1._import:
      if (this.options.ecmaVersion >= 11) {
        return this.parseExprImport(forNew);
      } else {
        return this.unexpected();
      }
    default:
      return this.parseExprAtomDefault();
  }
};
pp$5.parseExprAtomDefault = function() {
  this.unexpected();
};
pp$5.parseExprImport = function(forNew) {
  var node = this.startNode();
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword import");
  }
  this.next();
  if (this.type === types$1.parenL && !forNew) {
    return this.parseDynamicImport(node);
  } else if (this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "import";
    node.meta = this.finishNode(meta, "Identifier");
    return this.parseImportMeta(node);
  } else {
    this.unexpected();
  }
};
pp$5.parseDynamicImport = function(node) {
  this.next();
  node.source = this.parseMaybeAssign();
  if (this.options.ecmaVersion >= 16) {
    if (!this.eat(types$1.parenR)) {
      this.expect(types$1.comma);
      if (!this.afterTrailingComma(types$1.parenR)) {
        node.options = this.parseMaybeAssign();
        if (!this.eat(types$1.parenR)) {
          this.expect(types$1.comma);
          if (!this.afterTrailingComma(types$1.parenR)) {
            this.unexpected();
          }
        }
      } else {
        node.options = null;
      }
    } else {
      node.options = null;
    }
  } else {
    if (!this.eat(types$1.parenR)) {
      var errorPos = this.start;
      if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
        this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
      } else {
        this.unexpected(errorPos);
      }
    }
  }
  return this.finishNode(node, "ImportExpression");
};
pp$5.parseImportMeta = function(node) {
  this.next();
  var containsEsc = this.containsEsc;
  node.property = this.parseIdent(true);
  if (node.property.name !== "meta") {
    this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'");
  }
  if (containsEsc) {
    this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters");
  }
  if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere) {
    this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module");
  }
  return this.finishNode(node, "MetaProperty");
};
pp$5.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  if (node.raw.charCodeAt(node.raw.length - 1) === 110) {
    node.bigint = node.value != null ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, "");
  }
  this.next();
  return this.finishNode(node, "Literal");
};
pp$5.parseParenExpression = function() {
  this.expect(types$1.parenL);
  var val = this.parseExpression();
  this.expect(types$1.parenR);
  return val;
};
pp$5.shouldParseArrow = function(exprList) {
  return !this.canInsertSemicolon();
};
pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();
    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types$1.parenR) {
      first ? first = false : this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
        lastIsComma = true;
        break;
      } else if (this.type === types$1.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRestBinding()));
        if (this.type === types$1.comma) {
          this.raiseRecoverable(
            this.start,
            "Comma is not permitted after the rest element"
          );
        }
        break;
      } else {
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
    this.expect(types$1.parenR);
    if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList, forInit);
    }
    if (!exprList.length || lastIsComma) {
      this.unexpected(this.lastTokStart);
    }
    if (spreadStart) {
      this.unexpected(spreadStart);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }
  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression");
  } else {
    return val;
  }
};
pp$5.parseParenItem = function(item) {
  return item;
};
pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit);
};
var empty = [];
pp$5.parseNew = function() {
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword new");
  }
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "new";
    node.meta = this.finishNode(meta, "Identifier");
    this.next();
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target") {
      this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'");
    }
    if (containsEsc) {
      this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters");
    }
    if (!this.allowNewDotTarget) {
      this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block");
    }
    return this.finishNode(node, "MetaProperty");
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
  if (node.callee.type === "Super") {
    this.raiseRecoverable(startPos, "Invalid use of 'super'");
  }
  if (this.eat(types$1.parenL)) {
    node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false);
  } else {
    node.arguments = empty;
  }
  return this.finishNode(node, "NewExpression");
};
pp$5.parseTemplateElement = function(ref2) {
  var isTagged = ref2.isTagged;
  var elem = this.startNode();
  if (this.type === types$1.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value.replace(/\r\n?/g, "\n"),
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types$1.backQuote;
  return this.finishNode(elem, "TemplateElement");
};
pp$5.parseTemplate = function(ref2) {
  if (ref2 === void 0) ref2 = {};
  var isTagged = ref2.isTagged;
  if (isTagged === void 0) isTagged = false;
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({ isTagged });
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this.type === types$1.eof) {
      this.raise(this.pos, "Unterminated template literal");
    }
    this.expect(types$1.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(types$1.braceR);
    node.quasis.push(curElt = this.parseTemplateElement({ isTagged }));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};
pp$5.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" && (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || this.options.ecmaVersion >= 9 && this.type === types$1.star) && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$5.parseObj = function(isPattern, refDestructuringErrors) {
  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    var prop = this.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) {
      this.checkPropClash(prop, propHash, refDestructuringErrors);
    }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};
pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement");
    }
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    return this.finishNode(prop, "SpreadElement");
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern) {
      isGenerator = this.eat(types$1.star);
    }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
    this.parsePropertyName(prop);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property");
};
pp$5.parseGetterSetter = function(prop) {
  var kind = prop.key.name;
  this.parsePropertyName(prop);
  prop.value = this.parseMethod(false);
  prop.kind = kind;
  var paramCount = prop.kind === "get" ? 0 : 1;
  if (prop.value.params.length !== paramCount) {
    var start = prop.value.start;
    if (prop.kind === "get") {
      this.raiseRecoverable(start, "getter should have no params");
    } else {
      this.raiseRecoverable(start, "setter should have exactly one param");
    }
  } else {
    if (prop.kind === "set" && prop.value.params[0].type === "RestElement") {
      this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params");
    }
  }
};
pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types$1.colon) {
    this.unexpected();
  }
  if (this.eat(types$1.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
    if (isPattern) {
      this.unexpected();
    }
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
    prop.kind = "init";
  } else if (!isPattern && !containsEsc && this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.parseGetterSetter(prop);
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.checkUnreserved(prop.key);
    if (prop.key.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = startPos;
    }
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else if (this.type === types$1.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0) {
        refDestructuringErrors.shorthandAssign = this.start;
      }
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else {
      prop.value = this.copyNode(prop.key);
    }
    prop.kind = "init";
    prop.shorthand = true;
  } else {
    this.unexpected();
  }
};
pp$5.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types$1.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types$1.bracketR);
      return prop.key;
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
};
pp$5.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = node.expression = false;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = false;
  }
};
pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) {
    node.generator = isGenerator;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false, true, false);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "FunctionExpression");
};
pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "ArrowFunctionExpression");
};
pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
  var isExpression = isArrowFunction && this.type !== types$1.braceL;
  var oldStrict = this.strict, useStrict = false;
  if (isExpression) {
    node.body = this.parseMaybeAssign(forInit);
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      if (useStrict && nonSimple) {
        this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list");
      }
    }
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) {
      this.strict = true;
    }
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
    if (this.strict && node.id) {
      this.checkLValSimple(node.id, BIND_OUTSIDE);
    }
    node.body = this.parseBlock(false, void 0, useStrict && !oldStrict);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitScope();
};
pp$5.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1) {
    var param = list[i];
    if (param.type !== "Identifier") {
      return false;
    }
  }
  return true;
};
pp$5.checkParams = function(node, allowDuplicates) {
  var nameHash = /* @__PURE__ */ Object.create(null);
  for (var i = 0, list = node.params; i < list.length; i += 1) {
    var param = list[i];
    this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
  }
};
pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(close)) {
        break;
      }
    } else {
      first = false;
    }
    var elt = void 0;
    if (allowEmpty && this.type === types$1.comma) {
      elt = null;
    } else if (this.type === types$1.ellipsis) {
      elt = this.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
    } else {
      elt = this.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts;
};
pp$5.checkUnreserved = function(ref2) {
  var start = ref2.start;
  var end = ref2.end;
  var name = ref2.name;
  if (this.inGenerator && name === "yield") {
    this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
  }
  if (this.inAsync && name === "await") {
    this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
  }
  if (!(this.currentThisScope().flags & SCOPE_VAR) && name === "arguments") {
    this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer");
  }
  if (this.inClassStaticBlock && (name === "arguments" || name === "await")) {
    this.raise(start, "Cannot use " + name + " in class static initialization block");
  }
  if (this.keywords.test(name)) {
    this.raise(start, "Unexpected keyword '" + name + "'");
  }
  if (this.options.ecmaVersion < 6 && this.input.slice(start, end).indexOf("\\") !== -1) {
    return;
  }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await") {
      this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
    }
    this.raiseRecoverable(start, "The keyword '" + name + "' is reserved");
  }
};
pp$5.parseIdent = function(liberal) {
  var node = this.parseIdentNode();
  this.next(!!liberal);
  this.finishNode(node, "Identifier");
  if (!liberal) {
    this.checkUnreserved(node);
    if (node.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = node.start;
    }
  }
  return node;
};
pp$5.parseIdentNode = function() {
  var node = this.startNode();
  if (this.type === types$1.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;
    if ((node.name === "class" || node.name === "function") && (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
    this.type = types$1.name;
  } else {
    this.unexpected();
  }
  return node;
};
pp$5.parsePrivateIdent = function() {
  var node = this.startNode();
  if (this.type === types$1.privateId) {
    node.name = this.value;
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "PrivateIdentifier");
  if (this.options.checkPrivateFields) {
    if (this.privateNameStack.length === 0) {
      this.raise(node.start, "Private field '#" + node.name + "' must be declared in an enclosing class");
    } else {
      this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
    }
  }
  return node;
};
pp$5.parseYield = function(forInit) {
  if (!this.yieldPos) {
    this.yieldPos = this.start;
  }
  var node = this.startNode();
  this.next();
  if (this.type === types$1.semi || this.canInsertSemicolon() || this.type !== types$1.star && !this.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types$1.star);
    node.argument = this.parseMaybeAssign(forInit);
  }
  return this.finishNode(node, "YieldExpression");
};
pp$5.parseAwait = function(forInit) {
  if (!this.awaitPos) {
    this.awaitPos = this.start;
  }
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true, false, forInit);
  return this.finishNode(node, "AwaitExpression");
};
var pp$4 = Parser.prototype;
pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  if (this.sourceFile) {
    message += " in " + this.sourceFile;
  }
  var err = new SyntaxError(message);
  err.pos = pos;
  err.loc = loc;
  err.raisedAt = this.pos;
  throw err;
};
pp$4.raiseRecoverable = pp$4.raise;
pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart);
  }
};
var pp$3 = Parser.prototype;
var Scope = function Scope2(flags) {
  this.flags = flags;
  this.var = [];
  this.lexical = [];
  this.functions = [];
};
pp$3.enterScope = function(flags) {
  this.scopeStack.push(new Scope(flags));
};
pp$3.exitScope = function() {
  this.scopeStack.pop();
};
pp$3.treatFunctionsAsVarInScope = function(scope) {
  return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
};
pp$3.declareName = function(name, bindingType, pos) {
  var redeclared = false;
  if (bindingType === BIND_LEXICAL) {
    var scope = this.currentScope();
    redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    scope.lexical.push(name);
    if (this.inModule && scope.flags & SCOPE_TOP) {
      delete this.undefinedExports[name];
    }
  } else if (bindingType === BIND_SIMPLE_CATCH) {
    var scope$1 = this.currentScope();
    scope$1.lexical.push(name);
  } else if (bindingType === BIND_FUNCTION) {
    var scope$2 = this.currentScope();
    if (this.treatFunctionsAsVar) {
      redeclared = scope$2.lexical.indexOf(name) > -1;
    } else {
      redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1;
    }
    scope$2.functions.push(name);
  } else {
    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
      var scope$3 = this.scopeStack[i];
      if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH && scope$3.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
        redeclared = true;
        break;
      }
      scope$3.var.push(name);
      if (this.inModule && scope$3.flags & SCOPE_TOP) {
        delete this.undefinedExports[name];
      }
      if (scope$3.flags & SCOPE_VAR) {
        break;
      }
    }
  }
  if (redeclared) {
    this.raiseRecoverable(pos, "Identifier '" + name + "' has already been declared");
  }
};
pp$3.checkLocalExport = function(id) {
  if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1) {
    this.undefinedExports[id.name] = id;
  }
};
pp$3.currentScope = function() {
  return this.scopeStack[this.scopeStack.length - 1];
};
pp$3.currentVarScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) {
      return scope;
    }
  }
};
pp$3.currentThisScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) && !(scope.flags & SCOPE_ARROW)) {
      return scope;
    }
  }
};
var Node = function Node2(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations) {
    this.loc = new SourceLocation(parser, loc);
  }
  if (parser.options.directSourceFile) {
    this.sourceFile = parser.options.directSourceFile;
  }
  if (parser.options.ranges) {
    this.range = [pos, 0];
  }
};
var pp$2 = Parser.prototype;
pp$2.startNode = function() {
  return new Node(this, this.start, this.startLoc);
};
pp$2.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc);
};
function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations) {
    node.loc.end = loc;
  }
  if (this.options.ranges) {
    node.range[1] = pos;
  }
  return node;
}
pp$2.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};
pp$2.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};
pp$2.copyNode = function(node) {
  var newNode = new Node(this, node.start, this.startLoc);
  for (var prop in node) {
    newNode[prop] = node[prop];
  }
  return newNode;
};
var scriptValuesAddedInUnicode = "Berf Beria_Erfe Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sidetic Sidt Sunu Sunuwar Tai_Yo Tayo Todhri Todr Tolong_Siki Tols Tulu_Tigalari Tutg Unknown Zzzz";
var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
var ecma11BinaryProperties = ecma10BinaryProperties;
var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
var ecma13BinaryProperties = ecma12BinaryProperties;
var ecma14BinaryProperties = ecma13BinaryProperties;
var unicodeBinaryProperties = {
  9: ecma9BinaryProperties,
  10: ecma10BinaryProperties,
  11: ecma11BinaryProperties,
  12: ecma12BinaryProperties,
  13: ecma13BinaryProperties,
  14: ecma14BinaryProperties
};
var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";
var unicodeBinaryPropertiesOfStrings = {
  9: "",
  10: "",
  11: "",
  12: "",
  13: "",
  14: ecma14BinaryPropertiesOfStrings
};
var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";
var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;
var unicodeScriptValues = {
  9: ecma9ScriptValues,
  10: ecma10ScriptValues,
  11: ecma11ScriptValues,
  12: ecma12ScriptValues,
  13: ecma13ScriptValues,
  14: ecma14ScriptValues
};
var data = {};
function buildUnicodeData(ecmaVersion) {
  var d = data[ecmaVersion] = {
    binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
    binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
    nonBinary: {
      General_Category: wordsRegexp(unicodeGeneralCategoryValues),
      Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
    }
  };
  d.nonBinary.Script_Extensions = d.nonBinary.Script;
  d.nonBinary.gc = d.nonBinary.General_Category;
  d.nonBinary.sc = d.nonBinary.Script;
  d.nonBinary.scx = d.nonBinary.Script_Extensions;
}
for (i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
  ecmaVersion = list[i];
  buildUnicodeData(ecmaVersion);
}
var ecmaVersion;
var i;
var list;
var pp$1 = Parser.prototype;
var BranchID = function BranchID2(parent, base) {
  this.parent = parent;
  this.base = base || this;
};
BranchID.prototype.separatedFrom = function separatedFrom(alt) {
  for (var self = this; self; self = self.parent) {
    for (var other = alt; other; other = other.parent) {
      if (self.base === other.base && self !== other) {
        return true;
      }
    }
  }
  return false;
};
BranchID.prototype.sibling = function sibling() {
  return new BranchID(this.parent, this.base);
};
var RegExpValidationState = function RegExpValidationState2(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
  this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchV = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = /* @__PURE__ */ Object.create(null);
  this.backReferenceNames = [];
  this.branchID = null;
};
RegExpValidationState.prototype.reset = function reset(start, pattern, flags) {
  var unicodeSets = flags.indexOf("v") !== -1;
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
    this.switchU = true;
    this.switchV = true;
    this.switchN = true;
  } else {
    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
    this.switchV = false;
    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
  }
};
RegExpValidationState.prototype.raise = function raise(message) {
  this.parser.raiseRecoverable(this.start, "Invalid regular expression: /" + this.source + "/: " + message);
};
RegExpValidationState.prototype.at = function at(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1;
  }
  var c = s.charCodeAt(i);
  if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l) {
    return c;
  }
  var next = s.charCodeAt(i + 1);
  return next >= 56320 && next <= 57343 ? (c << 10) + next - 56613888 : c;
};
RegExpValidationState.prototype.nextIndex = function nextIndex(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l;
  }
  var c = s.charCodeAt(i), next;
  if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l || (next = s.charCodeAt(i + 1)) < 56320 || next > 57343) {
    return i + 1;
  }
  return i + 2;
};
RegExpValidationState.prototype.current = function current(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.pos, forceU);
};
RegExpValidationState.prototype.lookahead = function lookahead(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.nextIndex(this.pos, forceU), forceU);
};
RegExpValidationState.prototype.advance = function advance(forceU) {
  if (forceU === void 0) forceU = false;
  this.pos = this.nextIndex(this.pos, forceU);
};
RegExpValidationState.prototype.eat = function eat(ch, forceU) {
  if (forceU === void 0) forceU = false;
  if (this.current(forceU) === ch) {
    this.advance(forceU);
    return true;
  }
  return false;
};
RegExpValidationState.prototype.eatChars = function eatChars(chs, forceU) {
  if (forceU === void 0) forceU = false;
  var pos = this.pos;
  for (var i = 0, list = chs; i < list.length; i += 1) {
    var ch = list[i];
    var current2 = this.at(pos, forceU);
    if (current2 === -1 || current2 !== ch) {
      return false;
    }
    pos = this.nextIndex(pos, forceU);
  }
  this.pos = pos;
  return true;
};
pp$1.validateRegExpFlags = function(state) {
  var validFlags = state.validFlags;
  var flags = state.flags;
  var u = false;
  var v = false;
  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this.raise(state.start, "Duplicate regular expression flag");
    }
    if (flag === "u") {
      u = true;
    }
    if (flag === "v") {
      v = true;
    }
  }
  if (this.options.ecmaVersion >= 15 && u && v) {
    this.raise(state.start, "Invalid regular expression flag");
  }
};
function hasProp(obj) {
  for (var _ in obj) {
    return true;
  }
  return false;
}
pp$1.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);
  if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};
pp$1.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames = /* @__PURE__ */ Object.create(null);
  state.backReferenceNames.length = 0;
  state.branchID = null;
  this.regexp_disjunction(state);
  if (state.pos !== state.source.length) {
    if (state.eat(
      41
      /* ) */
    )) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(
      93
      /* ] */
    ) || state.eat(
      125
      /* } */
    )) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];
    if (!state.groupNames[name]) {
      state.raise("Invalid named capture referenced");
    }
  }
};
pp$1.regexp_disjunction = function(state) {
  var trackDisjunction = this.options.ecmaVersion >= 16;
  if (trackDisjunction) {
    state.branchID = new BranchID(state.branchID, null);
  }
  this.regexp_alternative(state);
  while (state.eat(
    124
    /* | */
  )) {
    if (trackDisjunction) {
      state.branchID = state.branchID.sibling();
    }
    this.regexp_alternative(state);
  }
  if (trackDisjunction) {
    state.branchID = state.branchID.parent;
  }
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(
    123
    /* { */
  )) {
    state.raise("Lone quantifier brackets");
  }
};
pp$1.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state)) {
  }
};
pp$1.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true;
  }
  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true;
  }
  return false;
};
pp$1.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;
  if (state.eat(
    94
    /* ^ */
  ) || state.eat(
    36
    /* $ */
  )) {
    return true;
  }
  if (state.eat(
    92
    /* \ */
  )) {
    if (state.eat(
      66
      /* B */
    ) || state.eat(
      98
      /* b */
    )) {
      return true;
    }
    state.pos = start;
  }
  if (state.eat(
    40
    /* ( */
  ) && state.eat(
    63
    /* ? */
  )) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(
        60
        /* < */
      );
    }
    if (state.eat(
      61
      /* = */
    ) || state.eat(
      33
      /* ! */
    )) {
      this.regexp_disjunction(state);
      if (!state.eat(
        41
        /* ) */
      )) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true;
    }
  }
  state.pos = start;
  return false;
};
pp$1.regexp_eatQuantifier = function(state, noError) {
  if (noError === void 0) noError = false;
  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(
      63
      /* ? */
    );
    return true;
  }
  return false;
};
pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
  return state.eat(
    42
    /* * */
  ) || state.eat(
    43
    /* + */
  ) || state.eat(
    63
    /* ? */
  ) || this.regexp_eatBracedQuantifier(state, noError);
};
pp$1.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(
    123
    /* { */
  )) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(
        44
        /* , */
      ) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(
        125
        /* } */
      )) {
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true;
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatAtom = function(state) {
  return this.regexp_eatPatternCharacters(state) || state.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state);
};
pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatAtomEscape(state)) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(
    40
    /* ( */
  )) {
    if (state.eat(
      63
      /* ? */
    )) {
      if (this.options.ecmaVersion >= 16) {
        var addModifiers = this.regexp_eatModifiers(state);
        var hasHyphen = state.eat(
          45
          /* - */
        );
        if (addModifiers || hasHyphen) {
          for (var i = 0; i < addModifiers.length; i++) {
            var modifier = addModifiers.charAt(i);
            if (addModifiers.indexOf(modifier, i + 1) > -1) {
              state.raise("Duplicate regular expression modifiers");
            }
          }
          if (hasHyphen) {
            var removeModifiers = this.regexp_eatModifiers(state);
            if (!addModifiers && !removeModifiers && state.current() === 58) {
              state.raise("Invalid regular expression modifiers");
            }
            for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
              var modifier$1 = removeModifiers.charAt(i$1);
              if (removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 || addModifiers.indexOf(modifier$1) > -1) {
                state.raise("Duplicate regular expression modifiers");
              }
            }
          }
        }
      }
      if (state.eat(
        58
        /* : */
      )) {
        this.regexp_disjunction(state);
        if (state.eat(
          41
          /* ) */
        )) {
          return true;
        }
        state.raise("Unterminated group");
      }
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatCapturingGroup = function(state) {
  if (state.eat(
    40
    /* ( */
  )) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 63) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(
      41
      /* ) */
    )) {
      state.numCapturingParens += 1;
      return true;
    }
    state.raise("Unterminated group");
  }
  return false;
};
pp$1.regexp_eatModifiers = function(state) {
  var modifiers = "";
  var ch = 0;
  while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
    modifiers += codePointToString(ch);
    state.advance();
  }
  return modifiers;
};
function isRegularExpressionModifier(ch) {
  return ch === 105 || ch === 109 || ch === 115;
}
pp$1.regexp_eatExtendedAtom = function(state) {
  return state.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state) || this.regexp_eatInvalidBracedQuantifier(state) || this.regexp_eatExtendedPatternCharacter(state);
};
pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false;
};
pp$1.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
function isSyntaxCharacter(ch) {
  return ch === 36 || ch >= 40 && ch <= 43 || ch === 46 || ch === 63 || ch >= 91 && ch <= 94 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start;
};
pp$1.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (ch !== -1 && ch !== 36 && !(ch >= 40 && ch <= 43) && ch !== 46 && ch !== 63 && ch !== 91 && ch !== 94 && ch !== 124) {
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_groupSpecifier = function(state) {
  if (state.eat(
    63
    /* ? */
  )) {
    if (!this.regexp_eatGroupName(state)) {
      state.raise("Invalid group");
    }
    var trackDisjunction = this.options.ecmaVersion >= 16;
    var known = state.groupNames[state.lastStringValue];
    if (known) {
      if (trackDisjunction) {
        for (var i = 0, list = known; i < list.length; i += 1) {
          var altID = list[i];
          if (!altID.separatedFrom(state.branchID)) {
            state.raise("Duplicate capture group name");
          }
        }
      } else {
        state.raise("Duplicate capture group name");
      }
    }
    if (trackDisjunction) {
      (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
    } else {
      state.groupNames[state.lastStringValue] = true;
    }
  }
};
pp$1.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(
    60
    /* < */
  )) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(
      62
      /* > */
    )) {
      return true;
    }
    state.raise("Invalid capture group name");
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true;
  }
  state.pos = start;
  return false;
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 36 || ch === 95;
}
pp$1.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true;
  }
  state.pos = start;
  return false;
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 36 || ch === 95 || ch === 8204 || ch === 8205;
}
pp$1.regexp_eatAtomEscape = function(state) {
  if (this.regexp_eatBackReference(state) || this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state) || state.switchN && this.regexp_eatKGroupName(state)) {
    return true;
  }
  if (state.switchU) {
    if (state.current() === 99) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false;
};
pp$1.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true;
    }
    if (n <= state.numCapturingParens) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatKGroupName = function(state) {
  if (state.eat(
    107
    /* k */
  )) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true;
    }
    state.raise("Invalid named reference");
  }
  return false;
};
pp$1.regexp_eatCharacterEscape = function(state) {
  return this.regexp_eatControlEscape(state) || this.regexp_eatCControlLetter(state) || this.regexp_eatZero(state) || this.regexp_eatHexEscapeSequence(state) || this.regexp_eatRegExpUnicodeEscapeSequence(state, false) || !state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state) || this.regexp_eatIdentityEscape(state);
};
pp$1.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatControlLetter(state)) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatZero = function(state) {
  if (state.current() === 48 && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 116) {
    state.lastIntValue = 9;
    state.advance();
    return true;
  }
  if (ch === 110) {
    state.lastIntValue = 10;
    state.advance();
    return true;
  }
  if (ch === 118) {
    state.lastIntValue = 11;
    state.advance();
    return true;
  }
  if (ch === 102) {
    state.lastIntValue = 12;
    state.advance();
    return true;
  }
  if (ch === 114) {
    state.lastIntValue = 13;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 32;
    state.advance();
    return true;
  }
  return false;
};
function isControlLetter(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
}
pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
  if (forceU === void 0) forceU = false;
  var start = state.pos;
  var switchU = forceU || state.switchU;
  if (state.eat(
    117
    /* u */
  )) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (switchU && lead >= 55296 && lead <= 56319) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(
          92
          /* \ */
        ) && state.eat(
          117
          /* u */
        ) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 56320 && trail <= 57343) {
            state.lastIntValue = (lead - 55296) * 1024 + (trail - 56320) + 65536;
            return true;
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true;
    }
    if (switchU && state.eat(
      123
      /* { */
    ) && this.regexp_eatHexDigits(state) && state.eat(
      125
      /* } */
    ) && isValidUnicode(state.lastIntValue)) {
      return true;
    }
    if (switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }
  return false;
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 1114111;
}
pp$1.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true;
    }
    if (state.eat(
      47
      /* / */
    )) {
      state.lastIntValue = 47;
      return true;
    }
    return false;
  }
  var ch = state.current();
  if (ch !== 99 && (!state.switchN || ch !== 107)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 49 && ch <= 57) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
      state.advance();
    } while ((ch = state.current()) >= 48 && ch <= 57);
    return true;
  }
  return false;
};
var CharSetNone = 0;
var CharSetOk = 1;
var CharSetString = 2;
pp$1.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();
  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return CharSetOk;
  }
  var negate = false;
  if (state.switchU && this.options.ecmaVersion >= 9 && ((negate = ch === 80) || ch === 112)) {
    state.lastIntValue = -1;
    state.advance();
    var result;
    if (state.eat(
      123
      /* { */
    ) && (result = this.regexp_eatUnicodePropertyValueExpression(state)) && state.eat(
      125
      /* } */
    )) {
      if (negate && result === CharSetString) {
        state.raise("Invalid property name");
      }
      return result;
    }
    state.raise("Invalid property name");
  }
  return CharSetNone;
};
function isCharacterClassEscape(ch) {
  return ch === 100 || ch === 68 || ch === 115 || ch === 83 || ch === 119 || ch === 87;
}
pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(
    61
    /* = */
  )) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return CharSetOk;
    }
  }
  state.pos = start;
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
  }
  return CharSetNone;
};
pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!hasOwn(state.unicodeProperties.nonBinary, name)) {
    state.raise("Invalid property name");
  }
  if (!state.unicodeProperties.nonBinary[name].test(value)) {
    state.raise("Invalid property value");
  }
};
pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (state.unicodeProperties.binary.test(nameOrValue)) {
    return CharSetOk;
  }
  if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) {
    return CharSetString;
  }
  state.raise("Invalid property name");
};
pp$1.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== "";
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 95;
}
pp$1.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== "";
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
}
pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state);
};
pp$1.regexp_eatCharacterClass = function(state) {
  if (state.eat(
    91
    /* [ */
  )) {
    var negate = state.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state);
    if (!state.eat(
      93
      /* ] */
    )) {
      state.raise("Unterminated character class");
    }
    if (negate && result === CharSetString) {
      state.raise("Negated character class may contain strings");
    }
    return true;
  }
  return false;
};
pp$1.regexp_classContents = function(state) {
  if (state.current() === 93) {
    return CharSetOk;
  }
  if (state.switchV) {
    return this.regexp_classSetExpression(state);
  }
  this.regexp_nonEmptyClassRanges(state);
  return CharSetOk;
};
pp$1.regexp_nonEmptyClassRanges = function(state) {
  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(
      45
      /* - */
    ) && this.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};
pp$1.regexp_eatClassAtom = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatClassEscape(state)) {
      return true;
    }
    if (state.switchU) {
      var ch$1 = state.current();
      if (ch$1 === 99 || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  var ch = state.current();
  if (ch !== 93) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatClassEscape = function(state) {
  var start = state.pos;
  if (state.eat(
    98
    /* b */
  )) {
    state.lastIntValue = 8;
    return true;
  }
  if (state.switchU && state.eat(
    45
    /* - */
  )) {
    state.lastIntValue = 45;
    return true;
  }
  if (!state.switchU && state.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true;
    }
    state.pos = start;
  }
  return this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state);
};
pp$1.regexp_classSetExpression = function(state) {
  var result = CharSetOk, subResult;
  if (this.regexp_eatClassSetRange(state)) ;
  else if (subResult = this.regexp_eatClassSetOperand(state)) {
    if (subResult === CharSetString) {
      result = CharSetString;
    }
    var start = state.pos;
    while (state.eatChars(
      [38, 38]
      /* && */
    )) {
      if (state.current() !== 38 && (subResult = this.regexp_eatClassSetOperand(state))) {
        if (subResult !== CharSetString) {
          result = CharSetOk;
        }
        continue;
      }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) {
      return result;
    }
    while (state.eatChars(
      [45, 45]
      /* -- */
    )) {
      if (this.regexp_eatClassSetOperand(state)) {
        continue;
      }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) {
      return result;
    }
  } else {
    state.raise("Invalid character in character class");
  }
  for (; ; ) {
    if (this.regexp_eatClassSetRange(state)) {
      continue;
    }
    subResult = this.regexp_eatClassSetOperand(state);
    if (!subResult) {
      return result;
    }
    if (subResult === CharSetString) {
      result = CharSetString;
    }
  }
};
pp$1.regexp_eatClassSetRange = function(state) {
  var start = state.pos;
  if (this.regexp_eatClassSetCharacter(state)) {
    var left = state.lastIntValue;
    if (state.eat(
      45
      /* - */
    ) && this.regexp_eatClassSetCharacter(state)) {
      var right = state.lastIntValue;
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatClassSetOperand = function(state) {
  if (this.regexp_eatClassSetCharacter(state)) {
    return CharSetOk;
  }
  return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state);
};
pp$1.regexp_eatNestedClass = function(state) {
  var start = state.pos;
  if (state.eat(
    91
    /* [ */
  )) {
    var negate = state.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state);
    if (state.eat(
      93
      /* ] */
    )) {
      if (negate && result === CharSetString) {
        state.raise("Negated character class may contain strings");
      }
      return result;
    }
    state.pos = start;
  }
  if (state.eat(
    92
    /* \ */
  )) {
    var result$1 = this.regexp_eatCharacterClassEscape(state);
    if (result$1) {
      return result$1;
    }
    state.pos = start;
  }
  return null;
};
pp$1.regexp_eatClassStringDisjunction = function(state) {
  var start = state.pos;
  if (state.eatChars(
    [92, 113]
    /* \q */
  )) {
    if (state.eat(
      123
      /* { */
    )) {
      var result = this.regexp_classStringDisjunctionContents(state);
      if (state.eat(
        125
        /* } */
      )) {
        return result;
      }
    } else {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return null;
};
pp$1.regexp_classStringDisjunctionContents = function(state) {
  var result = this.regexp_classString(state);
  while (state.eat(
    124
    /* | */
  )) {
    if (this.regexp_classString(state) === CharSetString) {
      result = CharSetString;
    }
  }
  return result;
};
pp$1.regexp_classString = function(state) {
  var count = 0;
  while (this.regexp_eatClassSetCharacter(state)) {
    count++;
  }
  return count === 1 ? CharSetOk : CharSetString;
};
pp$1.regexp_eatClassSetCharacter = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatCharacterEscape(state) || this.regexp_eatClassSetReservedPunctuator(state)) {
      return true;
    }
    if (state.eat(
      98
      /* b */
    )) {
      state.lastIntValue = 8;
      return true;
    }
    state.pos = start;
    return false;
  }
  var ch = state.current();
  if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) {
    return false;
  }
  if (isClassSetSyntaxCharacter(ch)) {
    return false;
  }
  state.advance();
  state.lastIntValue = ch;
  return true;
};
function isClassSetReservedDoublePunctuatorCharacter(ch) {
  return ch === 33 || ch >= 35 && ch <= 38 || ch >= 42 && ch <= 44 || ch === 46 || ch >= 58 && ch <= 64 || ch === 94 || ch === 96 || ch === 126;
}
function isClassSetSyntaxCharacter(ch) {
  return ch === 40 || ch === 41 || ch === 45 || ch === 47 || ch >= 91 && ch <= 93 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
  var ch = state.current();
  if (isClassSetReservedPunctuator(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
function isClassSetReservedPunctuator(ch) {
  return ch === 33 || ch === 35 || ch === 37 || ch === 38 || ch === 44 || ch === 45 || ch >= 58 && ch <= 62 || ch === 64 || ch === 96 || ch === 126;
}
pp$1.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 95) {
    state.lastIntValue = ch % 32;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(
    120
    /* x */
  )) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true;
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
    state.advance();
  }
  return state.pos !== start;
};
function isDecimalDigit(ch) {
  return ch >= 48 && ch <= 57;
}
pp$1.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start;
};
function isHexDigit(ch) {
  return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102;
}
function hexToInt(ch) {
  if (ch >= 65 && ch <= 70) {
    return 10 + (ch - 65);
  }
  if (ch >= 97 && ch <= 102) {
    return 10 + (ch - 97);
  }
  return ch - 48;
}
pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 48;
    state.advance();
    return true;
  }
  state.lastIntValue = 0;
  return false;
};
function isOctalDigit(ch) {
  return ch >= 48 && ch <= 55;
}
pp$1.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false;
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true;
};
var Token = function Token2(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations) {
    this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
  }
  if (p.options.ranges) {
    this.range = [p.start, p.end];
  }
};
var pp = Parser.prototype;
pp.next = function(ignoreEscapeSequenceInKeyword) {
  if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword);
  }
  if (this.options.onToken) {
    this.options.onToken(new Token(this));
  }
  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};
pp.getToken = function() {
  this.next();
  return new Token(this);
};
if (typeof Symbol !== "undefined") {
  pp[Symbol.iterator] = function() {
    var this$1$1 = this;
    return {
      next: function() {
        var token = this$1$1.getToken();
        return {
          done: token.type === types$1.eof,
          value: token
        };
      }
    };
  };
}
pp.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) {
    this.skipSpace();
  }
  this.start = this.pos;
  if (this.options.locations) {
    this.startLoc = this.curPosition();
  }
  if (this.pos >= this.input.length) {
    return this.finishToken(types$1.eof);
  }
  if (curContext.override) {
    return curContext.override(this);
  } else {
    this.readToken(this.fullCharCodeAtPos());
  }
};
pp.readToken = function(code) {
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92) {
    return this.readWord();
  }
  return this.getTokenFromCode(code);
};
pp.fullCharCodeAt = function(pos) {
  var code = this.input.charCodeAt(pos);
  if (code <= 55295 || code >= 56320) {
    return code;
  }
  var next = this.input.charCodeAt(pos + 1);
  return next <= 56319 || next >= 57344 ? code : (code << 10) + next - 56613888;
};
pp.fullCharCodeAtPos = function() {
  return this.fullCharCodeAt(this.pos);
};
pp.skipBlockComment = function() {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) {
    this.raise(this.pos - 2, "Unterminated comment");
  }
  this.pos = end + 2;
  if (this.options.locations) {
    for (var nextBreak = void 0, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1; ) {
      ++this.curLine;
      pos = this.lineStart = nextBreak;
    }
  }
  if (this.options.onComment) {
    this.options.onComment(
      true,
      this.input.slice(start + 2, end),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipLineComment = function(startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this.input.charCodeAt(++this.pos);
  }
  if (this.options.onComment) {
    this.options.onComment(
      false,
      this.input.slice(start + startSkip, this.pos),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipSpace = function() {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
      case 32:
      case 160:
        ++this.pos;
        break;
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10:
      case 8232:
      case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break;
      case 47:
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42:
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment(2);
            break;
          default:
            break loop;
        }
        break;
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop;
        }
    }
  }
};
pp.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) {
    this.endLoc = this.curPosition();
  }
  var prevType = this.type;
  this.type = type;
  this.value = val;
  this.updateContext(prevType);
};
pp.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) {
    return this.readNumber(true);
  }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    this.pos += 3;
    return this.finishToken(types$1.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(types$1.dot);
  }
};
pp.readToken_slash = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;
    return this.readRegexp();
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.slash, 1);
};
pp.readToken_mult_modulo_exp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types$1.star : types$1.modulo;
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types$1.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, size + 1);
  }
  return this.finishOp(tokentype, size);
};
pp.readToken_pipe_amp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (this.options.ecmaVersion >= 12) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 === 61) {
        return this.finishOp(types$1.assign, 3);
      }
    }
    return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1);
};
pp.readToken_caret = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.bitwiseXOR, 1);
};
pp.readToken_plus_min = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 && (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(types$1.incDec, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.plusMin, 1);
};
pp.readToken_lt_gt = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) {
      return this.finishOp(types$1.assign, size + 1);
    }
    return this.finishOp(types$1.bitShift, size);
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 && this.input.charCodeAt(this.pos + 3) === 45) {
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) {
    size = 2;
  }
  return this.finishOp(types$1.relational, size);
};
pp.readToken_eq_excl = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    this.pos += 2;
    return this.finishToken(types$1.arrow);
  }
  return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1);
};
pp.readToken_question = function() {
  var ecmaVersion = this.options.ecmaVersion;
  if (ecmaVersion >= 11) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 46) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 < 48 || next2 > 57) {
        return this.finishOp(types$1.questionDot, 2);
      }
    }
    if (next === 63) {
      if (ecmaVersion >= 12) {
        var next2$1 = this.input.charCodeAt(this.pos + 2);
        if (next2$1 === 61) {
          return this.finishOp(types$1.assign, 3);
        }
      }
      return this.finishOp(types$1.coalesce, 2);
    }
  }
  return this.finishOp(types$1.question, 1);
};
pp.readToken_numberSign = function() {
  var ecmaVersion = this.options.ecmaVersion;
  var code = 35;
  if (ecmaVersion >= 13) {
    ++this.pos;
    code = this.fullCharCodeAtPos();
    if (isIdentifierStart(code, true) || code === 92) {
      return this.finishToken(types$1.privateId, this.readWord1());
    }
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.getTokenFromCode = function(code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      return this.readToken_dot();
    // Punctuation tokens.
    case 40:
      ++this.pos;
      return this.finishToken(types$1.parenL);
    case 41:
      ++this.pos;
      return this.finishToken(types$1.parenR);
    case 59:
      ++this.pos;
      return this.finishToken(types$1.semi);
    case 44:
      ++this.pos;
      return this.finishToken(types$1.comma);
    case 91:
      ++this.pos;
      return this.finishToken(types$1.bracketL);
    case 93:
      ++this.pos;
      return this.finishToken(types$1.bracketR);
    case 123:
      ++this.pos;
      return this.finishToken(types$1.braceL);
    case 125:
      ++this.pos;
      return this.finishToken(types$1.braceR);
    case 58:
      ++this.pos;
      return this.finishToken(types$1.colon);
    case 96:
      if (this.options.ecmaVersion < 6) {
        break;
      }
      ++this.pos;
      return this.finishToken(types$1.backQuote);
    case 48:
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) {
        return this.readRadixNumber(16);
      }
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) {
          return this.readRadixNumber(8);
        }
        if (next === 98 || next === 66) {
          return this.readRadixNumber(2);
        }
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      return this.readNumber(false);
    // Quotes produce strings.
    case 34:
    case 39:
      return this.readString(code);
    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.
    case 47:
      return this.readToken_slash();
    case 37:
    case 42:
      return this.readToken_mult_modulo_exp(code);
    case 124:
    case 38:
      return this.readToken_pipe_amp(code);
    case 94:
      return this.readToken_caret();
    case 43:
    case 45:
      return this.readToken_plus_min(code);
    case 60:
    case 62:
      return this.readToken_lt_gt(code);
    case 61:
    case 33:
      return this.readToken_eq_excl(code);
    case 63:
      return this.readToken_question();
    case 126:
      return this.finishOp(types$1.prefix, 1);
    case 35:
      return this.readToken_numberSign();
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};
pp.readRegexp = function() {
  var escaped, inClass, start = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(start, "Unterminated regular expression");
    }
    var ch = this.input.charAt(this.pos);
    if (lineBreak.test(ch)) {
      this.raise(start, "Unterminated regular expression");
    }
    if (!escaped) {
      if (ch === "[") {
        inClass = true;
      } else if (ch === "]" && inClass) {
        inClass = false;
      } else if (ch === "/" && !inClass) {
        break;
      }
      escaped = ch === "\\";
    } else {
      escaped = false;
    }
    ++this.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) {
    this.unexpected(flagsStart);
  }
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
  }
  return this.finishToken(types$1.regexp, { pattern, flags, value });
};
pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
  var allowSeparators = this.options.ecmaVersion >= 12 && len === void 0;
  var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;
  var start = this.pos, total = 0, lastCode = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
    var code = this.input.charCodeAt(this.pos), val = void 0;
    if (allowSeparators && code === 95) {
      if (isLegacyOctalNumericLiteral) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals");
      }
      if (lastCode === 95) {
        this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore");
      }
      if (i === 0) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits");
      }
      lastCode = code;
      continue;
    }
    if (code >= 97) {
      val = code - 97 + 10;
    } else if (code >= 65) {
      val = code - 65 + 10;
    } else if (code >= 48 && code <= 57) {
      val = code - 48;
    } else {
      val = Infinity;
    }
    if (val >= radix) {
      break;
    }
    lastCode = code;
    total = total * radix + val;
  }
  if (allowSeparators && lastCode === 95) {
    this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits");
  }
  if (this.pos === start || len != null && this.pos - start !== len) {
    return null;
  }
  return total;
};
function stringToNumber(str, isLegacyOctalNumericLiteral) {
  if (isLegacyOctalNumericLiteral) {
    return parseInt(str, 8);
  }
  return parseFloat(str.replace(/_/g, ""));
}
function stringToBigInt(str) {
  if (typeof BigInt !== "function") {
    return null;
  }
  return BigInt(str.replace(/_/g, ""));
}
pp.readRadixNumber = function(radix) {
  var start = this.pos;
  this.pos += 2;
  var val = this.readInt(radix);
  if (val == null) {
    this.raise(this.start + 2, "Expected number in radix " + radix);
  }
  if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
    val = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
  } else if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  return this.finishToken(types$1.num, val);
};
pp.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10, void 0, true) === null) {
    this.raise(start, "Invalid number");
  }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) {
    this.raise(start, "Invalid number");
  }
  var next = this.input.charCodeAt(this.pos);
  if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
    var val$1 = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
    if (isIdentifierStart(this.fullCharCodeAtPos())) {
      this.raise(this.pos, "Identifier directly after number");
    }
    return this.finishToken(types$1.num, val$1);
  }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) {
    octal = false;
  }
  if (next === 46 && !octal) {
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) {
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) {
      ++this.pos;
    }
    if (this.readInt(10) === null) {
      this.raise(start, "Invalid number");
    }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  var val = stringToNumber(this.input.slice(start, this.pos), octal);
  return this.finishToken(types$1.num, val);
};
pp.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;
  if (ch === 123) {
    if (this.options.ecmaVersion < 6) {
      this.unexpected();
    }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 1114111) {
      this.invalidStringToken(codePos, "Code point out of bounds");
    }
  } else {
    code = this.readHexChar(4);
  }
  return code;
};
pp.readString = function(quote) {
  var out = "", chunkStart = ++this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated string constant");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) {
      break;
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else if (ch === 8232 || ch === 8233) {
      if (this.options.ecmaVersion < 10) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else {
      if (isNewLine(ch)) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types$1.string, out);
};
var INVALID_TEMPLATE_ESCAPE_ERROR = {};
pp.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err;
    }
  }
  this.inTemplateElement = false;
};
pp.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR;
  } else {
    this.raise(position, message);
  }
};
pp.readTmplToken = function() {
  var out = "", chunkStart = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated template");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(types$1.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(types$1.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(types$1.template, out);
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) {
            ++this.pos;
          }
        case 10:
          out += "\n";
          break;
        default:
          out += String.fromCharCode(ch);
          break;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};
pp.readInvalidTemplateToken = function() {
  for (; this.pos < this.input.length; this.pos++) {
    switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break;
      case "$":
        if (this.input[this.pos + 1] !== "{") {
          break;
        }
      // fall through
      case "`":
        return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos));
      case "\r":
        if (this.input[this.pos + 1] === "\n") {
          ++this.pos;
        }
      // fall through
      case "\n":
      case "\u2028":
      case "\u2029":
        ++this.curLine;
        this.lineStart = this.pos + 1;
        break;
    }
  }
  this.raise(this.start, "Unterminated template");
};
pp.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
    case 110:
      return "\n";
    // 'n' -> '\n'
    case 114:
      return "\r";
    // 'r' -> '\r'
    case 120:
      return String.fromCharCode(this.readHexChar(2));
    // 'x'
    case 117:
      return codePointToString(this.readCodePoint());
    // 'u'
    case 116:
      return "	";
    // 't' -> '\t'
    case 98:
      return "\b";
    // 'b' -> '\b'
    case 118:
      return "\v";
    // 'v' -> '\u000b'
    case 102:
      return "\f";
    // 'f' -> '\f'
    case 13:
      if (this.input.charCodeAt(this.pos) === 10) {
        ++this.pos;
      }
    // '\r\n'
    case 10:
      if (this.options.locations) {
        this.lineStart = this.pos;
        ++this.curLine;
      }
      return "";
    case 56:
    case 57:
      if (this.strict) {
        this.invalidStringToken(
          this.pos - 1,
          "Invalid escape sequence"
        );
      }
      if (inTemplate) {
        var codePos = this.pos - 1;
        this.invalidStringToken(
          codePos,
          "Invalid escape sequence in template string"
        );
      }
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate ? "Octal literal in template string" : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal);
      }
      if (isNewLine(ch)) {
        if (this.options.locations) {
          this.lineStart = this.pos;
          ++this.curLine;
        }
        return "";
      }
      return String.fromCharCode(ch);
  }
};
pp.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) {
    this.invalidStringToken(codePos, "Bad character escape sequence");
  }
  return n;
};
pp.readWord1 = function() {
  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this.pos += ch <= 65535 ? 1 : 2;
    } else if (ch === 92) {
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) !== 117) {
        this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      }
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) {
        this.invalidStringToken(escStart, "Invalid Unicode escape");
      }
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};
pp.readWord = function() {
  var word = this.readWord1();
  var type = types$1.name;
  if (this.keywords.test(word)) {
    type = keywords[word];
  }
  return this.finishToken(type, word);
};
var version = "8.19.0";
Parser.acorn = {
  Parser,
  version,
  defaultOptions,
  Position,
  SourceLocation,
  getLineInfo,
  Node,
  TokenType,
  tokTypes: types$1,
  keywordTypes: keywords,
  TokContext,
  tokContexts: types,
  isIdentifierChar,
  isIdentifierStart,
  Token,
  isNewLine,
  lineBreak,
  lineBreakG,
  nonASCIIwhitespace
};
function parse3(input, options) {
  return Parser.parse(input, options);
}

// server/validate-source.ts
function validateSource(path, content) {
  try {
    if (/\.(?:m?js)$/i.test(path)) parse3(content, { ecmaVersion: "latest", sourceType: "module" });
    else if (/\.json$/i.test(path)) JSON.parse(content);
  } catch (error) {
    throw new Error(`${path} \u8BED\u6CD5\u65E0\u6548\uFF1A${error.message}`);
  }
  return content;
}

// server/format-source.ts
var runtime;
function load() {
  return runtime ||= (async () => {
    const root = new URL("../runtime/prettier/", import.meta.url);
    const [prettier, ...plugins] = await Promise.all(["standalone.mjs", "plugins/babel.mjs", "plugins/estree.mjs", "plugins/html.mjs", "plugins/postcss.mjs"].map((file) => import(new URL(file, root).href)));
    return { prettier, plugins, options: JSON.parse(await readFile(new URL("options.json", root), "utf8")) };
  })();
}
async function formatSource(path, source) {
  validateSource(path, source);
  const parser = /\.html?$/i.test(path) ? "html" : /\.(?:m?js)$/i.test(path) ? "babel" : /\.css$/i.test(path) ? "css" : /\.json$/i.test(path) ? "json-stringify" : void 0;
  if (!parser) return source;
  if (parser === "html" && (!/<html\b/i.test(source) || !/<\/body>/i.test(source) || !/<\/html>\s*$/i.test(source))) return source;
  if (parser === "html") for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(match[1])) continue;
    const type = match[1].match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1].toLowerCase() || "";
    if (type === "application/json" || type === "application/ld+json") validateSource(`${path}:inline.json`, match[2]);
    else if (!type || type === "module" || /^(?:text|application)\/(?:javascript|ecmascript)$/.test(type)) validateSource(`${path}:inline.js`, match[2]);
  }
  try {
    const { prettier, plugins, options } = await load();
    const formatted = await prettier.format(source, { ...options, parser, plugins });
    validateSource(path, formatted);
    return formatted;
  } catch (error) {
    throw Error(`${path} Prettier\u683C\u5F0F\u5316\u5931\u8D25\uFF1A${error.message}`);
  }
}

// server/templates.ts
import { readFile as readFile2 } from "fs/promises";
import { join } from "path";
function overview(text2, layout) {
  const original = text2.match(/## Overview([\s\S]*?)(?=## Code|$)/)?.[1].trim() || "";
  if (!layout) return original;
  return original.replace(/^(?:Shop catalog page|About Us corporate brand page)[^\n]*/m, layout.summary).replace(/### Dimensions & Responsiveness[\s\S]*?(?=### Attributes)/, `### Dimensions & Responsiveness
- Grid: ${layout.columns}.
- Regions: ${layout.regions.join(", ")}.
- Mobile: ${layout.mobile}.
- Container follows selected source and site theme.

`);
}
async function readTemplates(skillRoot, input) {
  const shopLayouts = JSON.parse(await readFile2(join(skillRoot, "references/shop-layouts.json"), "utf8"));
  Object.assign(shopLayouts, JSON.parse(await readFile2(join(skillRoot, "references/about-layouts.json"), "utf8")));
  const catalog = JSON.parse(await readFile2(join(skillRoot, "catalog.json"), "utf8"));
  for (const item of catalog) if (shopLayouts[item.id]) item.summary = shopLayouts[item.id].summary;
  if (input.mode === "select") {
    const slots = [...new Set(catalog.map((item) => item.category))];
    return slots.filter((category) => !input.category || input.category === category).flatMap((category) => {
      const candidates = catalog.filter((item) => item.category === category).map(({ id, summary }) => ({ id, summary, ...input.usage ? { usage: input.usage[id] || { projects: 0 } } : {} }));
      return candidates.length ? [{ category, candidates, selection: "Unranked candidates. Agent chooses compatible templates after deciding the site palette, light/dark strategy, content widths and layout. Include only needed sections; -01 is valid. No theme or width is chosen by this tool. Compare at least 3 Shop/About candidates (or all if fewer). Use actual region/layout differences and project usage history to avoid always choosing the first or most-used layout; prefer a compatible less-used alternative for a new site. Existing-site edits retain the current layout unless redesign is requested." }] : [];
    });
  }
  const selected = input.ids?.length ? input.ids.map((id) => {
    const found = catalog.find((item) => item.id === id);
    if (!found) throw new Error(`\u6A21\u677F\u4E0D\u5B58\u5728\uFF1A${id}`);
    return found;
  }) : catalog.filter((item) => !input.category || item.category === input.category);
  if (input.mode === "summary") return selected.map(({ id, category, summary }) => ({ id, category, summary }));
  if (!input.ids?.length || input.ids.length > 12) throw new Error("\u6BCF\u6B21\u53EA\u8BFB\u53D6\u672C\u8F6E\u8981\u4F7F\u7528\u7684 1\u201312 \u4E2A\u6A21\u677F");
  return Promise.all(selected.map(async (item) => {
    const text2 = await readFile2(join(skillRoot, "templates", item.file), "utf8");
    if (input.mode === "doc") return { id: item.id, doc: overview(text2, shopLayouts[item.id]) };
    const section = input.section || "all", result = { id: item.id, overview: overview(text2, shopLayouts[item.id]), usage: "Use this source and region map as the implementation reference. Fidelity is SKILL guidance only; no automatic similarity score or readiness gate. Source bindings are optional traceability. Agent decides a coherent site design and validates actual rendering and interactions." };
    for (const [part, label, language] of [["html", "HTML", "html"], ["js", "JavaScript", "javascript"], ["css", "CSS", "css"]]) if (section === "all" || section === part) {
      const match = text2.match(new RegExp(`### ${label}\\s*\`\`\`${language}([\\s\\S]*?)\`\`\``));
      if (match) result[part] = match[1].trim();
    }
    if (shopLayouts[item.id]) result.layoutContract = JSON.stringify(shopLayouts[item.id]);
    result.requiredParts = ["HTML", "JavaScript", "CSS"].filter((label) => text2.includes(`### ${label}`)).join(", ");
    result.integrationNotes = "Agent chooses a coherent palette/light-dark strategy/content width in app.js; demo colors and widths are not defaults. Keep the selected template slots, responsive columns and Swiper; do not invent extra regions. Adapt all tags and registrations to unique xxx-component names, with one registration per constructor. Default new cart output to components/cart.js drawer; cart.html only when explicitly requested or required by an existing page-mode site, never both. Logo must be an img/picture asset. Mobile (<768px) root font-size is exactly 12px. Complete homepages add 1\u20132 distinct category/story/promotion/service sections beyond header/footer/hero/product list, without repeating the same section. Commerce configuration lives in app.js. No fidelity scoring is performed; code output uses local Prettier. Write each completed HTML page before generating the next; keep page logic inline. Imported product images require explicit render-time storeData.imageUrl and SDK.category uses the regrouped taxonomy. Do not restore demo wrappers. Actual HTML layout overrides generic Overview and global radius/spacing suggestions. For Shop read the paired Card code, replace defaultProducts with SDK queries, map every legacy tag/selector to card-component, and preserve all filters/drawers/grid-list behavior. No character/emoji icons or hand-drawn SVG product/banner images.";
    return result;
  }));
}

// server/projects.ts
import { mkdir, readFile as readFile3, rename, writeFile, open, unlink, realpath, stat, readdir } from "fs/promises";
import { randomBytes, randomUUID, createHash } from "crypto";
import { dirname, isAbsolute, join as join2, relative, resolve, sep } from "path";

// server/assemble.ts
import { posix } from "path";
function injectSharedUI(html, path) {
  if (!/<html\b/i.test(html) || !/<\/body>/i.test(html) || !/<\/html>\s*$/i.test(html)) return html;
  if (!/<head\b/i.test(html)) html = html.replace(/<html\b[^>]*>/i, (match) => `${match}<head></head>`);
  const src = posix.relative(posix.dirname(path), "components/toast.js");
  if (!/<script\b[^>]*\bsrc\s*=\s*["'][^"']*\bcomponents\/toast\.js["']/i.test(html)) html = html.replace(/<head\b[^>]*>/i, (match) => `${match}
<script src="${src}"></script>`);
  if (!/<toast-component\b/i.test(html)) html = html.replace(/<\/body>/i, "<toast-component></toast-component>\n</body>");
  return html;
}
function assemblePage(body, title, language = "en", options = {}) {
  if (/<html\b/i.test(body)) return body;
  const scripts = [];
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => {
    scripts.push(script);
    return "";
  });
  const links = [];
  body = body.replace(/<link\b[^>]*>/gi, (link) => {
    links.push(link);
    return "";
  });
  const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const drawer = options.cart === "drawer" && !/<cart-component\b/i.test(body) ? '<cart-component view-mode="drawer"></cart-component>' : "";
  return `<!doctype html>
<html lang="${escape(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.css">
${links.join("\n")}
<script src="https://cdn.tailwindcss.com"></script><script src="js/app.js"></script>
</head><body class="m-0 bg-surface font-sans text-content antialiased"><header-component></header-component>${body}${drawer}<footer-component></footer-component>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.js"></script>${options.commerceConfig ? '<script src="js/commerce-config.js"></script>' : ""}${options.commerce ? '<script src="js/ec-sdk.js"></script><script src="js/sdk.js"></script>' : ""}<script src="js/data.js"></script>
${options.commerce ? "<script>window.SDK.init(window.productData, window.commerceConfig || {});</script>" : ""}
<script src="components/header.js"></script><script src="components/footer.js"></script>${options.cart && options.cart !== "none" ? '<script src="components/cart.js"></script>' : ""}<script src="components/card.js"></script>${scripts.join("\n")}</body></html>`;
}

// server/projects.ts
import { fileURLToPath } from "url";

// server/template-source.ts
function regionMarkers(binding) {
  return { start: `<!-- Source Template: ${binding.id} | Region: ${binding.region} -->`, end: `<!-- /Source Template: ${binding.region} -->` };
}

// server/projects.ts
var DEFAULT_PAGES = ["index", "shop", "product", "wishlist", "checkout", "login", "register", "about", "contact", "terms", "privacy", "return"].map((name) => ({ path: `${name}.html`, title: name }));
var idPattern = /^[a-f0-9]{4}(?:-[a-f0-9]{4}){3}$/;
var pause = (ms) => new Promise((resolve4) => setTimeout(resolve4, ms));
async function json(file) {
  try {
    return JSON.parse(await readFile3(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
async function atomic(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, value, "utf8");
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(temp, file);
        break;
      } catch (error) {
        if (attempt >= 25 || !["EPERM", "EACCES", "EBUSY"].includes(error.code || "")) throw error;
        await pause(Math.min(20 * (attempt + 1), 120));
      }
    }
  } finally {
    await unlink(temp).catch(() => {
    });
  }
}
var ProjectStore = class {
  constructor(root) {
    this.root = root;
    this.root = resolve(root);
    this.stateRoot = join2(dirname(this.root), ".builder-state");
  }
  root;
  skillRoot = (process.env.WEBSITE_BUILDER_SKILL_ROOT || fileURLToPath(new URL("../../skills/website-builder/", import.meta.url))).replaceAll("${PLUGIN_ROOT}", fileURLToPath(new URL("../../", import.meta.url)));
  stateRoot;
  binding(thread) {
    if (!thread.trim()) throw new Error("\u9700\u8981\u5F53\u524D\u771F\u5B9E thread_id\uFF0C\u4E0D\u80FD\u4F7F\u7528\u5171\u4EAB\u533F\u540D\u4F1A\u8BDD");
    return join2(this.stateRoot, "threads", createHash("sha256").update(thread).digest("hex") + ".json");
  }
  folder(id) {
    if (!idPattern.test(id)) throw new Error("\u9879\u76EE ID \u65E0\u6548");
    return join2(this.root, id);
  }
  metadataDirectory(id) {
    this.folder(id);
    return join2(this.stateRoot, "projects", id);
  }
  manifest(id) {
    return join2(this.metadataDirectory(id), "project.json");
  }
  async loadProject(id) {
    return await json(this.manifest(id)) || await json(join2(this.folder(id), ".website-builder.json"));
  }
  async lock(key, run) {
    await mkdir(join2(this.stateRoot, "locks"), { recursive: true });
    const file = join2(this.stateRoot, "locks", createHash("sha256").update(key).digest("hex") + ".lock");
    let handle;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        handle = await open(file, "wx");
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const info = await stat(file).catch(() => null);
        if (info && Date.now() - info.mtimeMs > 12e4) await unlink(file).catch(() => {
        });
        await pause(50);
      }
    }
    if (!handle) throw new Error("\u9879\u76EE\u6B63\u5728\u5199\u5165\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    try {
      return await run();
    } finally {
      await handle.close();
      await unlink(file).catch(() => {
      });
    }
  }
  async save(project) {
    project.revision = randomUUID();
    project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await atomic(this.manifest(project.id), JSON.stringify(project, null, 2));
  }
  async get(threadId, projectId) {
    const binding = threadId ? await json(this.binding(threadId)) : await json(join2(this.stateRoot, "active.json"));
    const id = projectId || binding?.projectId;
    if (!id) return null;
    const project = await this.loadProject(id);
    if (!project) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
    const base = await realpath(this.root), folder = await realpath(this.folder(id)), rel = relative(base, folder);
    if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("\u9879\u76EE\u76EE\u5F55\u4E0D\u80FD\u6307\u5411\u5916\u90E8");
    const currentThread = threadId || binding?.threadId || "";
    return { project, threadId: currentThread, directory: this.folder(id), metadataDirectory: this.metadataDirectory(id), revision: `${id}:${currentThread}:${project.revision}` };
  }
  async list() {
    await mkdir(this.root, { recursive: true });
    const projects = [];
    for (const entry of await readdir(this.root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !idPattern.test(entry.name)) continue;
      const project = await this.loadProject(entry.name);
      if (project) projects.push({ id: project.id, name: project.name, updatedAt: project.updatedAt });
    }
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async templateUsage() {
    const usage = {};
    for (const project of await this.list()) {
      let data2;
      try {
        data2 = await json(join2(this.metadataDirectory(project.id), "website-builder.templates.json")) || await json(join2(this.folder(project.id), "website-builder.templates.json"));
      } catch {
        continue;
      }
      const items = Array.isArray(data2) ? data2 : Array.isArray(data2?.bindings) ? data2.bindings : Object.values(data2 || {});
      const ids = new Set(items.map((item) => typeof item === "string" ? item : item?.id).filter((id) => typeof id === "string" && /^[a-z]+-[0-9]+$/.test(id)));
      for (const id of ids) {
        const previous = usage[id];
        usage[id] = { projects: (previous?.projects || 0) + 1, lastUsed: previous?.lastUsed && previous.lastUsed > project.updatedAt ? previous.lastUsed : project.updatedAt };
      }
    }
    return usage;
  }
  async open(input) {
    return this.lock(`thread:${input.threadId}`, async () => {
      let view = input.newProject ? null : await this.get(input.threadId, input.projectId);
      if (!view) {
        if (input.projectId) throw new Error("\u6307\u5B9A\u9879\u76EE\u4E0D\u5B58\u5728\uFF0C\u4E0D\u4F1A\u7528\u76F8\u540C\u540D\u5B57\u521B\u5EFA\u66FF\u4EE3\u9879\u76EE");
        const id = randomBytes(8).toString("hex").match(/.{4}/g).join("-");
        const pages = (input.pages || DEFAULT_PAGES).map((page) => ({ ...page, path: this.path(page.path, true), status: "queued", version: 0 }));
        if (new Set(pages.map((page) => page.path)).size !== pages.length) throw new Error("\u9875\u9762\u8DEF\u5F84\u91CD\u590D");
        const project = { id, name: input.name || "Ecommerce website", brief: input.brief || "", language: input.language || "en", revision: "", pages, updatedAt: "" };
        await mkdir(this.folder(id), { recursive: true });
        await this.save(project);
        view = { project, threadId: input.threadId, directory: this.folder(id), metadataDirectory: this.metadataDirectory(id), revision: `${id}:${input.threadId}:${project.revision}` };
      }
      const binding = { threadId: input.threadId, projectId: view.project.id };
      await atomic(this.binding(input.threadId), JSON.stringify(binding));
      await atomic(join2(this.stateRoot, "active.json"), JSON.stringify(binding));
      return view;
    });
  }
  path(value, htmlOnly = false) {
    if (isAbsolute(value) || value.includes("\\") || value.includes("\0") || value.split("/").some((part) => !part || part === "." || part === ".." || part.startsWith(".")) || /[:<>"|?*]/.test(value)) throw new Error("\u53EA\u5141\u8BB8\u9879\u76EE\u5185\u7684\u76F8\u5BF9\u6587\u4EF6\u8DEF\u5F84");
    if (htmlOnly && !/\.html?$/i.test(value)) throw new Error("\u9875\u9762\u5FC5\u987B\u662F HTML \u6587\u4EF6");
    return value;
  }
  async target(id, value) {
    const path = this.path(value), metadata = /^website-builder\.[a-z-]+\.json$/.test(path);
    if (metadata) await mkdir(this.metadataDirectory(id), { recursive: true });
    const root = await realpath(metadata ? this.metadataDirectory(id) : this.folder(id));
    if (metadata) {
      const base = await realpath(this.stateRoot), rel = relative(base, root);
      if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("\u7BA1\u7406\u76EE\u5F55\u4E0D\u80FD\u6307\u5411\u5916\u90E8");
    }
    let folder = root;
    for (const part of path.split("/").slice(0, -1)) {
      folder = join2(folder, part);
      await mkdir(folder, { recursive: true });
      const actual = await realpath(folder);
      const rel = relative(root, actual);
      if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("\u9879\u76EE\u8DEF\u5F84\u4E0D\u80FD\u7ECF\u8FC7\u5916\u90E8\u7B26\u53F7\u94FE\u63A5");
    }
    const file = join2(root, path);
    try {
      const actual = await realpath(file);
      const rel = relative(root, actual);
      if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("\u6587\u4EF6\u4E0D\u80FD\u6307\u5411\u9879\u76EE\u5916\u90E8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return file;
  }
  async update(threadId, work) {
    const existing = await this.get(threadId);
    if (!existing) throw new Error("\u8BF7\u5148\u6253\u5F00\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE");
    return this.lock(existing.project.id, async () => {
      const view = await this.get(threadId);
      if (view.project.id !== existing.project.id) throw new Error("\u4F1A\u8BDD\u9879\u76EE\u5DF2\u5207\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u9879\u76EE");
      await work(view);
      await this.save(view.project);
      return await this.get(threadId);
    });
  }
  async plan(threadId, pages) {
    return this.update(threadId, async ({ project }) => {
      for (const page of pages) {
        this.path(page.path, true);
        const current2 = project.pages.find((item) => item.path === page.path);
        if (current2) current2.title = page.title;
        else project.pages.push({ ...page, status: "queued", version: 0 });
      }
    });
  }
  async begin(threadId, paths) {
    return this.update(threadId, async ({ project }) => {
      for (const path of paths) {
        this.path(path, true);
        const page = project.pages.find((item) => item.path === path);
        if (!page) throw new Error(`\u9875\u9762\u672A\u5728\u8BA1\u5212\u5185\uFF1A${path}`);
        page.generationHash = await this.sourceHash(project.id, path);
        page.status = "generating";
        page.version++;
        delete page.error;
      }
    });
  }
  async sourceHash(id, path) {
    const source = await readFile3(await this.target(id, path)).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    return source ? createHash("sha256").update(source).digest("hex") : "";
  }
  // Direct-file generation may finish without a tool callback. Only a complete,
  // changed document can leave generating; begin must not redisplay the old file.
  async reconcile(threadId) {
    const view = await this.get(threadId);
    if (!view) return null;
    const candidates = async (current2) => {
      const paths = [];
      for (const page of current2.project.pages) {
        if (page.status !== "generating" || page.generationHash === void 0) continue;
        const source = await readFile3(await this.target(current2.project.id, page.path), "utf8").catch(() => null);
        if (source && /<html\b/i.test(source) && /<body\b/i.test(source) && /<\/body>/i.test(source) && /<\/html>\s*$/i.test(source) && createHash("sha256").update(source).digest("hex") !== page.generationHash) paths.push(page.path);
      }
      return paths;
    };
    if (!(await candidates(view)).length) return view;
    return this.update(view.threadId, async (current2) => {
      await this.complete(current2, await candidates(current2));
    });
  }
  async bindTemplates(threadId, bindings) {
    for (const binding of bindings) {
      this.path(binding.file);
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(binding.region)) throw new Error("\u533A\u57DF\u540D\u53EA\u5141\u8BB8\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u548C\u77ED\u6A2A\u7EBF");
      await readTemplates(this.skillRoot, { mode: "doc", ids: [binding.id] });
    }
    const view = await this.update(threadId, async (view2) => {
      const file = await this.target(view2.project.id, "website-builder.templates.json");
      const previous = await json(file) || await json(join2(view2.directory, "website-builder.templates.json"));
      const merged = [...previous?.bindings || []];
      for (const binding of bindings) {
        const index = merged.findIndex((item) => item.file === binding.file && item.region === binding.region);
        if (index >= 0) merged[index] = binding;
        else merged.push(binding);
      }
      await atomic(file, JSON.stringify({ version: 2, purpose: "source-trace-only", bindings: merged }, null, 2));
    });
    return { project_id: view.project.id, bindings: bindings.map((binding) => ({ ...binding, ...regionMarkers(binding) })), advisory: true };
  }
  async auditTemplates(threadId) {
    const view = await this.get(threadId);
    if (!view) throw new Error("\u8BF7\u5148\u6253\u5F00\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE");
    const sources = await json(await this.target(view.project.id, "website-builder.templates.json")) || await json(join2(view.directory, "website-builder.templates.json"));
    return { advisory: true, configured: !!sources, bindings: sources?.bindings || [], message: "Template fidelity is SKILL guidance only. No structure score or generation pass/fail is calculated. Page readiness uses complete HTML and local dependency validation." };
  }
  async complete(view, paths) {
    for (const path of paths) {
      const page = view.project.pages.find((item) => item.path === path);
      if (!page) throw new Error(`\u9875\u9762\u672A\u5728\u8BA1\u5212\u5185\uFF1A${path}`);
      try {
        const file = await this.target(view.project.id, path);
        let html = await readFile3(file, "utf8");
        if (!/<html\b/i.test(html) || !/<\/html>\s*$/i.test(html) || !/<body\b/i.test(html) || !/<\/body>/i.test(html)) throw new Error("HTML \u5C1A\u672A\u5B8C\u6574\u8F93\u51FA");
        const toastPath = await this.target(view.project.id, "components/toast.js");
        if (!await stat(toastPath).catch(() => null)) await atomic(toastPath, await formatSource("components/toast.js", await readFile3(join2(this.skillRoot, "assets/ui/toast.js"), "utf8")));
        const enhanced = await formatSource(path, injectSharedUI(html, path));
        if (enhanced !== html) {
          await atomic(file, enhanced);
          html = enhanced;
        }
        for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi)) {
          if (/^(?:[a-z]+:|\/\/)/i.test(match[1])) continue;
          const relativePath = relative(view.directory, resolve(dirname(file), match[1])).split(sep).join("/");
          await stat(await this.target(view.project.id, relativePath));
        }
        page.status = "ready";
        page.version++;
        delete page.error;
        delete page.generationHash;
      } catch (error) {
        page.status = "error";
        page.error = error.message;
        page.version++;
        delete page.generationHash;
      }
    }
  }
  async finish(threadId, paths) {
    return this.update(threadId, async (view) => {
      await this.complete(view, paths.length ? paths : view.project.pages.filter((page) => page.status !== "ready").map((page) => page.path));
    });
  }
  async usesFiles(view, page, changed) {
    const document2 = resolve(view.directory, page), visited = /* @__PURE__ */ new Set();
    const visit = async (file) => {
      const path = relative(view.directory, file).split(sep).join("/");
      if (changed.has(path)) return true;
      if (visited.has(file)) return false;
      visited.add(file);
      if (!/\.(?:html?|js|css)$/i.test(file)) return false;
      let text2;
      try {
        text2 = await readFile3(await this.target(view.project.id, path), "utf8");
      } catch {
        return false;
      }
      const refs = [...text2.matchAll(/(?:\b(?:src|href)\s*=\s*["']|url\(\s*["']?|["'`])([^"'`\s<>)]*\.(?:js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|mp3|json)(?:[?#][^"'`\s<>)]*)?)/gi)];
      for (const match of refs) {
        const url = match[1].replaceAll("&amp;", "&");
        if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
        const target = url.startsWith("/") ? resolve(view.directory, url.slice(1).split(/[?#]/)[0]) : resolve(dirname(/\.js$/i.test(file) ? document2 : file), url.split(/[?#]/)[0]);
        if (await visit(target)) return true;
      }
      return false;
    };
    return visit(document2);
  }
  async write(threadId, files, finalizePages) {
    if (!files.length) throw new Error("\u6CA1\u6709\u6587\u4EF6\u5185\u5BB9");
    files.forEach((file) => {
      this.path(file.path);
      if (/(?:^|\/)(?:tmp|temp|artifacts|test-results|playwright-report)(?:\/|$)|\.(?:tmp|bak|log|psd)$/i.test(file.path)) throw new Error("\u7F51\u7AD9\u8F93\u51FA\u76EE\u5F55\u662F\u751F\u4EA7\u76EE\u5F55\uFF1B\u4E34\u65F6\u6587\u4EF6\u3001\u62A5\u544A\u4E0E\u6E90\u7D20\u6750\u8BF7\u4FDD\u5B58\u5230 metadata_directory");
    });
    return this.update(threadId, async (view) => {
      for (const path of finalizePages || []) if (!view.project.pages.some((page) => page.path === path)) throw new Error(`\u9875\u9762\u672A\u5728\u8BA1\u5212\u5185\uFF1A${path}`);
      for (const file of files) if (/\.html?$/i.test(file.path) && !view.project.pages.some((page) => page.path === file.path)) throw new Error(`\u8BF7\u5148\u5C06\u9875\u9762\u52A0\u5165\u8BA1\u5212\uFF1A${file.path}`);
      for (const file of files) {
        const page = view.project.pages.find((page2) => page2.path === file.path);
        if (page && file.title) page.title = file.title;
      }
      const hasFile = async (path) => files.some((file) => file.path === path) || !!await stat(join2(view.directory, path)).catch(() => null);
      const commerce = await hasFile("js/ec-sdk.js") && await hasFile("js/sdk.js");
      const commerceConfig = commerce && await hasFile("js/commerce-config.js");
      const cart = !await hasFile("components/cart.js") ? "none" : view.project.pages.some((page) => /(^|\/)cart\.html?$/i.test(page.path)) ? "page" : "drawer";
      const output = await Promise.all(files.map(async (file) => ({ ...file, content: await formatSource(file.path, /\.html?$/i.test(file.path) ? injectSharedUI(file.fragment ? assemblePage(file.content, file.title || view.project.pages.find((page) => page.path === file.path)?.title || view.project.name, view.project.language, { commerce, commerceConfig, cart }) : file.content, file.path) : file.content) }))).catch(async (error) => {
        const submitted = new Set(files.map((file) => file.path));
        for (const page of view.project.pages) if (page.status !== "ready" && (submitted.has(page.path) || page.status === "generating" && await this.usesFiles(view, page.path, submitted))) {
          page.status = "error";
          page.error = `\u4EE3\u7801\u683C\u5F0F/\u8BED\u6CD5\u6821\u9A8C\u5931\u8D25\uFF1A${error.message}`;
          page.version++;
          delete page.generationHash;
        }
        await this.save(view.project);
        throw error;
      });
      if (output.some((file) => /\.html?$/i.test(file.path) && /<toast-component\b/i.test(file.content)) && !await hasFile("components/toast.js")) output.push({ path: "components/toast.js", content: await formatSource("components/toast.js", await readFile3(join2(this.skillRoot, "assets/ui/toast.js"), "utf8")) });
      const changed = /* @__PURE__ */ new Set();
      for (const file of output) {
        const target = await this.target(view.project.id, file.path);
        if (await readFile3(target, "utf8").catch(() => null) !== file.content) changed.add(file.path);
      }
      const affected = [];
      for (const page of view.project.pages) if (changed.has(page.path) || await this.usesFiles(view, page.path, changed)) affected.push(page);
      for (const page of affected) {
        page.status = "generating";
        page.version++;
        delete page.error;
        delete page.generationHash;
      }
      await this.save(view.project);
      try {
        for (const file of output) if (changed.has(file.path)) await atomic(await this.target(view.project.id, file.path), file.content);
      } catch (error) {
        for (const page of affected) {
          page.status = "error";
          page.error = `\u6587\u4EF6\u5199\u5165\u5931\u8D25\uFF1A${error.message}`;
          page.version++;
        }
        await this.save(view.project);
        throw error;
      }
      const complete = [.../* @__PURE__ */ new Set([...finalizePages || [], ...files.filter((file) => /\.html?$/i.test(file.path)).map((file) => file.path), ...affected.map((page) => page.path)])];
      await this.complete(view, complete);
    });
  }
  async wait(since, threadId, waitMs = 2e4) {
    const deadline = Date.now() + Math.min(Math.max(waitMs, 0), 2e4);
    let view = await this.reconcile(threadId);
    while ((view?.revision || "none") === since && Date.now() < deadline) {
      await pause(Math.min(250, deadline - Date.now()));
      view = await this.reconcile(threadId);
    }
    return view;
  }
};

// server/resource-proxy.ts
import http from "http";
import https from "https";
import { lookup } from "dns";
import { isIP } from "net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";

// server/snapshot.ts
import { readFile as readFile5 } from "fs/promises";
import { basename as basename2, dirname as dirname2, extname as extname2, resolve as resolve3 } from "path";

// server/preview.ts
import { createServer } from "http";
import { readFile as readFile4, readdir as readdir2, realpath as realpath2, stat as stat2 } from "fs/promises";
import { basename, extname, isAbsolute as isAbsolute2, join as join3, relative as relative2, resolve as resolve2, sep as sep2 } from "path";
import { randomBytes as randomBytes2 } from "crypto";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/proxy-runtime.ts
var proxyRuntime = String.raw`<script>
(()=>{
 const requests=new Map(),cached=new Map();let sequence=0;
 const remote=value=>{try{const url=new URL(String(value),window.__websiteBuilderLocation);return /^https?:$/.test(url.protocol)&&(url.hostname!=='website-builder.invalid'||url.pathname.startsWith('/preview-assets/'))?url.href:null;}catch{return null;}};
 const request=(url,raw=false)=>{
  const key=(raw?'raw:':'asset:')+url;if(cached.has(key))return cached.get(key);
  const promise=new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{requests.delete(id);reject(new Error('资源代理超时：'+url));},60000);requests.set(id,{resolve,reject,timer});parent.postMessage({type:'website-builder:resource',id,url,raw},'*');});
  cached.set(key,promise);promise.catch(()=>cached.delete(key));return promise;
 };
 addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='website-builder:resource-result')return;const pending=requests.get(event.data.id);if(!pending)return;clearTimeout(pending.timer);requests.delete(event.data.id);if(event.data.error)pending.reject(new Error(event.data.error));else pending.resolve(event.data);});
 const fail=error=>parent.postMessage({type:'website-builder:resource-error',error:String(error.message||error)},'*');
 const dataURI=async url=>(await request(url)).data;
 window.__websiteBuilderImport=async url=>import(await dataURI(remote(url)||url));
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,options={})=>{
  const target=remote(typeof input==='string'||input instanceof URL?input:input.url);if(!target)return nativeFetch(input,options);
  const method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(!['GET','HEAD'].includes(method))throw new Error('预览资源代理仅支持 GET/HEAD，页面表单提交仍被阻止');
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  const value=await request(target,true);const response=await nativeFetch(value.data);return new Response(method==='HEAD'?null:await response.arrayBuffer(),{status:value.status||200,headers:{'Content-Type':value.mime}});
 };
 const nativeOpen=XMLHttpRequest.prototype.open,nativeSend=XMLHttpRequest.prototype.send,nativeAbort=XMLHttpRequest.prototype.abort,network=new WeakMap();
 XMLHttpRequest.prototype.open=function(method,url,...args){const target=remote(url);if(!target)return nativeOpen.call(this,method,url,...args);if(!['GET','HEAD'].includes(String(method).toUpperCase()))throw new Error('预览代理不发送写入请求');if(args[0]===false)throw new Error('预览代理不支持同步 XMLHttpRequest');network.set(this,{url:target,method,cancelled:false});return nativeOpen.call(this,'GET','data:text/plain,',true);};
 XMLHttpRequest.prototype.send=function(body){const state=network.get(this);if(!state)return nativeSend.call(this,body);const xhr=this;request(state.url,true).then(async value=>{if(state.cancelled)return;const response=await nativeFetch(value.data),buffer=await response.arrayBuffer(),text=new TextDecoder().decode(buffer);const result=xhr.responseType==='arraybuffer'?buffer:xhr.responseType==='blob'?new Blob([buffer],{type:value.mime}):xhr.responseType==='json'?JSON.parse(text):text;for(const [key,data]of Object.entries({readyState:4,status:value.status,statusText:'OK',responseURL:state.url,response:result,responseText:text}))Object.defineProperty(xhr,key,{configurable:true,value:data});xhr.getResponseHeader=name=>name.toLowerCase()==='content-type'?value.mime:null;xhr.getAllResponseHeaders=()=>'content-type: '+value.mime+'\r\n';xhr.dispatchEvent(new Event('readystatechange'));xhr.dispatchEvent(new ProgressEvent('load'));xhr.dispatchEvent(new ProgressEvent('loadend'));}).catch(error=>{if(state.cancelled)return;fail(error);xhr.dispatchEvent(new ProgressEvent('error'));xhr.dispatchEvent(new ProgressEvent('loadend'));});};
 XMLHttpRequest.prototype.abort=function(){const state=network.get(this);if(state)state.cancelled=true;return nativeAbort.call(this);};
 const nativeSet=Element.prototype.setAttribute,versions=new WeakMap();
 const resourceAttribute=(element,name)=>['src','srcset','poster','data'].includes(name)&&/^(IMG|SOURCE|VIDEO|AUDIO|TRACK|INPUT|SCRIPT|IFRAME|EMBED|OBJECT)$/.test(element.tagName)||name==='href'&&element.tagName==='LINK';
 const rewriteList=async value=>{
  const items=[];let index=0;
  while(index<value.length){while(/[\s,]/.test(value[index]||'')&&index<value.length)index++;const start=index,isData=value.slice(index,index+5)==='data:';while(index<value.length&&!/\s/.test(value[index])&&(isData||value[index]!==','))index++;let url=value.slice(start,index).replace(/,+$/,'');let descriptor='';if(value[index]!==','){const from=index;while(index<value.length&&value[index]!==',')index++;descriptor=value.slice(from,index).trim();}index++;if(url){const target=remote(url);items.push([target?await dataURI(target):url,descriptor].filter(Boolean).join(' '));}}
  return items.join(', ');
 };
 const assign=(element,name,value)=>{
  if(element.tagName==='LINK'&&/^(?:preconnect|dns-prefetch)$/i.test(element.rel)){element.removeAttribute('href');return true;}
  const target=name==='srcset'?/(?:^|,\s*)\s*(?:https?:)?\/\//i.test(value):remote(value);if(!target)return false;
  let tokens=versions.get(element);if(!tokens){tokens={};versions.set(element,tokens);}const token=Symbol();tokens[name]=token;
  nativeSet.call(element,'data-wb-'+name,value);
  (name==='srcset'?rewriteList(value):dataURI(target)).then(data=>{if(tokens[name]===token){nativeSet.call(element,name,data);element.removeAttribute('data-wb-'+name);}}).catch(fail);return true;
 };
 Element.prototype.setAttribute=function(name,value){if(resourceAttribute(this,name.toLowerCase())&&assign(this,name.toLowerCase(),String(value)))return;return nativeSet.call(this,name,value);};
 for(const [type,names]of [[HTMLImageElement,['src','srcset']],[HTMLScriptElement,['src']],[HTMLLinkElement,['href']],[HTMLMediaElement,['src']],[HTMLSourceElement,['src','srcset']],[HTMLVideoElement,['poster']],[HTMLInputElement,['src']],[HTMLEmbedElement,['src']],[HTMLObjectElement,['data']]])for(const name of names){const descriptor=Object.getOwnPropertyDescriptor(type.prototype,name);if(!descriptor?.set)continue;Object.defineProperty(type.prototype,name,{...descriptor,set(value){if(!assign(this,name,String(value)))descriptor.set.call(this,value);}});}
 const cssCache=new Map();
 const externalCSS=value=>/(?:url\(|@import\s+)[^;]*(?:https?:|\/\/)/i.test(value);
 const css=async value=>{let next=value;for(const match of [...value.matchAll(/@import\s+(['"])((?:https?:)?\/\/[^'"]+)\1/gi)])next=next.replace(match[0],'@import url("'+await dataURI(remote(match[2]))+'")');const matches=[...next.matchAll(/url\(\s*(['"]?)(https?:\/\/[^)'"\s]+|\/\/[^)'"\s]+)\1\s*\)/gi)];for(const match of matches)next=next.replace(match[0],'url("'+await dataURI(remote(match[2]))+'")');return next;};
 const nativeRule=CSSStyleSheet.prototype.insertRule,nativeReplace=CSSStyleSheet.prototype.replace,nativeReplaceSync=CSSStyleSheet.prototype.replaceSync;
 CSSStyleSheet.prototype.insertRule=function(rule,index=0){if(!externalCSS(rule))return nativeRule.call(this,rule,index);css(rule).then(value=>nativeRule.call(this,value,Math.min(index,this.cssRules.length))).catch(fail);return index;};
 if(nativeReplace)CSSStyleSheet.prototype.replace=function(text){return css(text).then(value=>nativeReplace.call(this,value));};
 if(nativeReplaceSync)CSSStyleSheet.prototype.replaceSync=function(text){if(!externalCSS(text))return nativeReplaceSync.call(this,text);css(text).then(value=>nativeReplaceSync.call(this,value)).catch(fail);};
 const scan=element=>{
  if(!(element instanceof Element))return;
  for(const name of ['src','srcset','href','poster','data']){const value=element.getAttribute('data-wb-'+name)||element.getAttribute(name);if(value&&resourceAttribute(element,name))assign(element,name,value);}
  const style=element.getAttribute('style');if(style&&externalCSS(style)&&cssCache.get(element)!==style){cssCache.set(element,style);css(style).then(value=>nativeSet.call(element,'style',value)).catch(fail);}
  if(element.tagName==='STYLE'&&externalCSS(element.textContent)&&cssCache.get(element)!==element.textContent){const text=element.textContent;cssCache.set(element,text);css(text).then(value=>element.textContent=value).catch(fail);}
 };
 new MutationObserver(records=>{for(const record of records){scan(record.target);if(record.type!=='attributes')for(const node of record.addedNodes){scan(node);if(node.querySelectorAll)node.querySelectorAll('*').forEach(scan);}}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','href','poster','data','style']});
 document.querySelectorAll('*').forEach(scan);
})();</script>`;

// server/preview.ts
var mime = { ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".mp4": "video/mp4", ".avif": "image/avif" };
var inside = (root, path) => {
  const rel = relative2(root, path);
  return rel === "" || !rel.startsWith(`..${sep2}`) && rel !== ".." && !isAbsolute2(rel);
};
var natural = (a, b) => a.localeCompare(b, "en", { numeric: true });
async function contained(root, path) {
  const target = await realpath2(resolve2(root, path));
  if (!inside(root, target)) throw new Error("\u76EE\u5F55\u8D85\u51FA\u5DF2\u914D\u7F6E\u7684\u7F51\u7AD9\u6839\u76EE\u5F55");
  return target;
}
async function scanSite(root, directory, prefix) {
  const site = await contained(root, directory);
  if (!(await stat2(site)).isDirectory()) throw new Error("\u8BF7\u9009\u62E9\u7F51\u7AD9\u76EE\u5F55");
  const documents = /* @__PURE__ */ new Map();
  async function walk(folder) {
    for (const entry of (await readdir2(folder, { withFileTypes: true })).sort((a, b) => natural(a.name, b.name))) {
      if (entry.name.startsWith(".") || ["node_modules", "vendor"].includes(entry.name) || entry.isSymbolicLink()) continue;
      const path = join3(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.html?$/i.test(entry.name)) documents.set(relative2(site, path).split(sep2).join("/"), await readFile4(path, "utf8"));
    }
  }
  await walk(site);
  if (!documents.size) throw new Error("\u76EE\u5F55\u4E2D\u6CA1\u6709\u627E\u5230 HTML \u9875\u9762");
  const ordered = [];
  const add = (path) => {
    if (documents.has(path) && !ordered.includes(path)) ordered.push(path);
  };
  const warnings = [];
  try {
    const data2 = await readFile4(await contained(root, join3(site, "js/data.js")), "utf8");
    if (data2.includes('"/img/')) {
      try {
        await stat2(join3(site, "img"));
      } catch {
        warnings.push("\u5546\u54C1\u56FE\u7247\u6CBF\u7528\u539F\u7AD9 CDN \u52A0\u8F7D\u3002");
      }
    }
  } catch {
  }
  let order = "\u9996\u9875\u3001\u4E3B\u5BFC\u822A\u3001\u9875\u811A\u5BFC\u822A\u3001\u5176\u4F59\u9875\u9762\u81EA\u7136\u6392\u5E8F";
  try {
    const file = await contained(root, join3(site, "website-builder.order.json"));
    const custom = JSON.parse(await readFile4(file, "utf8"));
    if (!Array.isArray(custom) || custom.some((path) => typeof path !== "string" || !documents.has(path))) throw new Error("\u6392\u5E8F\u6587\u4EF6\u5FC5\u987B\u4E3A\u73B0\u6709 HTML \u76F8\u5BF9\u8DEF\u5F84\u7684\u6570\u7EC4");
    custom.forEach(add);
    order = "website-builder.order.json\uFF0C\u7136\u540E\u8865\u5145\u672A\u5217\u51FA\u7684\u9875\u9762";
  } catch (error) {
    if (error.code !== "ENOENT") warnings.push(String(error.message));
  }
  add("index.html");
  add("index.htm");
  for (const navigation of ["components/header.js", "components/footer.js", "index.html"]) {
    try {
      const file = await contained(root, join3(site, navigation));
      const html = await readFile4(file, "utf8");
      for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#?]+\.html?)(?:[?#][^"']*)?["']/gi)) {
        const url = new URL(match[1], "https://site.local/");
        if (url.origin === "https://site.local") add(decodeURIComponent(url.pathname.slice(1)));
      }
    } catch {
    }
  }
  [...documents.keys()].sort(natural).forEach(add);
  const key = relative2(root, site).split(sep2).map(encodeURIComponent).join("/");
  return {
    directory: relative2(root, site).split(sep2).join("/") || ".",
    name: basename(site),
    order,
    warnings,
    pages: ordered.map((path) => ({ path, title: (documents.get(path).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? path).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(), url: `${prefix}/files/${key ? `${key}/` : ""}${path.split("/").map(encodeURIComponent).join("/")}` }))
  };
}
function instrument(html, embedded = false) {
  const script = `<style>html{height:auto!important;min-height:0!important;scrollbar-width:thin;scrollbar-color:transparent transparent!important}html[data-wb-scrolling]{scrollbar-color:rgba(75,100,87,.48) transparent!important}html::-webkit-scrollbar{width:7px;height:7px}html::-webkit-scrollbar-track{background:transparent}html::-webkit-scrollbar-thumb{background:transparent;border-radius:8px}html[data-wb-scrolling]::-webkit-scrollbar-thumb{background:rgba(75,100,87,.48)}html::-webkit-scrollbar-button{display:none}body{min-height:0!important}</style><script>
(() => {
  const virtualUrl = ${embedded ? '"__WEBSITE_BUILDER_VIRTUAL_URL__"' : "location.href"};
  window.__websiteBuilderLocation = new URL(virtualUrl);
  const embedded = ${embedded};
  if (embedded) {
    let stored = "__WEBSITE_BUILDER_STORAGE__";
    const storage = {getItem:key=>Object.prototype.hasOwnProperty.call(stored,key)?stored[key]:null,setItem(key,value){stored[String(key)]=String(value);parent.postMessage({type:'website-builder:storage',value:stored},'*');},removeItem(key){delete stored[key];parent.postMessage({type:'website-builder:storage',value:stored},'*');},clear(){stored={};parent.postMessage({type:'website-builder:storage',value:stored},'*');},key:index=>Object.keys(stored)[index]||null,get length(){return Object.keys(stored).length;}};
    Object.defineProperty(window,'localStorage',{value:storage}); Object.defineProperty(window,'sessionStorage',{value:storage});
    // Preserve embedded images when the demo's optional URL formatter adds its CDN prefix.
    let imageFormatter;
    Object.defineProperty(window,'formatCdnUrl',{configurable:true,get:()=>imageFormatter,set:fn=>{imageFormatter=typeof fn==='function'?function(url,...args){return typeof url==='string' && /^(data:|blob:)/i.test(url)?url:fn.call(this,url,...args);}:fn;}});
    addEventListener('message',event=>{if(event.source===parent && event.data?.type==='website-builder:storage-sync'){stored=event.data.value;dispatchEvent(new Event('storage'));}});
  }
  let previous = 0, pending = false;
  let scrollIdle;
  addEventListener('scroll',()=>{document.documentElement.dataset.wbScrolling='true';clearTimeout(scrollIdle);scrollIdle=setTimeout(()=>delete document.documentElement.dataset.wbScrolling,900);},true);
  const send = () => { pending = false; if (!document.body) return;
    const body = document.body, styles = getComputedStyle(body);
    // body.scrollHeight can equal the current iframe viewport even after content shrinks.
    // Measure normal-flow bounds separately so a formerly tall frame can become shorter.
    const bottom = Array.from(body.children).reduce((height,child) => getComputedStyle(child).position === 'fixed' ? height : Math.max(height,child.getBoundingClientRect().bottom + scrollY),0);
    const height = Math.ceil(Math.max(body.offsetHeight, body.getBoundingClientRect().height, bottom, body.scrollHeight > innerHeight + 1 ? body.scrollHeight : 0) + parseFloat(styles.marginTop || 0) + parseFloat(styles.marginBottom || 0));
    if (height !== previous) { previous = height; parent.postMessage({type:'website-builder:height',height}, '*'); }
  };
  const measure = () => { if (!pending) { pending = true; setTimeout(send, 80); } };
  addEventListener('DOMContentLoaded', () => {
    new ResizeObserver(measure).observe(document.body);
    new MutationObserver(measure).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
    document.fonts.ready.then(measure); send();
    parent.postMessage({type:'website-builder:location',path:new URL(virtualUrl).pathname},'*');
  });
  addEventListener('load',measure,true); addEventListener('resize',measure);
  addEventListener('message',event => { if(event.source === parent && event.data?.type === 'website-builder:measure') { document.documentElement.style.setProperty('overflow-y','auto','important');previous = 0; measure(); } });
  const local = value => { try { const url = new URL(value,virtualUrl), current = new URL(virtualUrl); return url.origin === current.origin && url.pathname.startsWith(current.pathname.split('/files/')[0] + '/files/'); } catch { return false; } };
  const blocked = url => parent.postMessage({type:'website-builder:blocked',url:String(url)},'*');
  const navigate = url => blocked(new URL(url,virtualUrl).href);
  window.__websiteBuilderNavigate = url => { if(local(url))navigate(url);else blocked(url); };
  if(embedded) {
    let state = null;
    Object.defineProperty(history,'state',{get:()=>state});
    for(const name of ['replaceState','pushState'])history[name] = function(value,_unused,url){
      const next = new URL(url || window.__websiteBuilderLocation.href,window.__websiteBuilderLocation.href);
      if(!local(next.href) || next.pathname !== new URL(virtualUrl).pathname){blocked(next.href);return;}
      state=value;window.__websiteBuilderLocation=next;
      document.querySelector('base').href=next.href;
    };
  }
  if(embedded)HTMLFormElement.prototype.submit = function(){const action=this.action || virtualUrl;if(local(action))navigate(action);else blocked(action);};
  // Chromium Navigation API also catches script location.assign/href/replace and direct form.submit().
  window.navigation?.addEventListener('navigate',event => { if (event.cancelable && (embedded || !local(event.destination.url))) { event.preventDefault(); if(local(event.destination.url))navigate(event.destination.url);else blocked(event.destination.url); } });
  window.open = function(url) { if (local(url)) { if(embedded)navigate(url);else location.href = new URL(url,virtualUrl).href; } else blocked(url); return null; };
  document.addEventListener('click',event => {
    const anchor = event.target.closest?.('a[href]'); if(!anchor) return;
    const url = new URL(anchor.getAttribute('href'),virtualUrl);
    if(url.protocol === 'javascript:') return;
    if(!local(url.href)) { event.preventDefault(); event.stopImmediatePropagation(); blocked(url.href); }
    else if(embedded) {
      event.preventDefault();event.stopImmediatePropagation();
      if(url.pathname === new URL(virtualUrl).pathname && url.hash) {
        const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if(target)parent.postMessage({type:'website-builder:scroll-to',y:target.getBoundingClientRect().top},'*');
      } else navigate(url.href);
    }
    else if(anchor.target && anchor.target !== '_self') anchor.target = '_self';
  },true);
  document.addEventListener('submit',event => {const form=event.target;const action=(event.submitter?.hasAttribute('formaction')?event.submitter.formAction:form.action)||virtualUrl;event.preventDefault();blocked(action);},true);
  document.addEventListener('pointerdown',()=>parent.postMessage({type:'website-builder:focus'},'*'),true);
  document.addEventListener('wheel',event=>{
    if (!event.ctrlKey && !event.metaKey) {
      let target = event.target;
      while(target && target !== document.body) { const css = getComputedStyle(target); if (/(auto|scroll)/.test(css.overflowY) && target.scrollHeight > target.clientHeight && ((event.deltaY > 0 && target.scrollTop + target.clientHeight < target.scrollHeight) || (event.deltaY < 0 && target.scrollTop > 0))) return; target = target.parentElement; }
      const root=document.scrollingElement;
      if(root && root.scrollHeight>innerHeight+1 && ((event.deltaY>0 && root.scrollTop+innerHeight<root.scrollHeight-1)||(event.deltaY<0 && root.scrollTop>0)))return;
    }
    event.preventDefault(); parent.postMessage({type:'website-builder:wheel',dx:event.shiftKey?event.deltaY:event.deltaX,dy:event.shiftKey?0:event.deltaY,zoom:event.ctrlKey||event.metaKey,x:event.clientX,y:event.clientY},'*');
  },{passive:false});
})();</script>`;
  const base = embedded ? '<base href="__WEBSITE_BUILDER_BASE_URL__">' : "";
  return /<head\b[^>]*>/i.test(html) ? html.replace(/<head\b[^>]*>/i, (match) => match + base + script + proxyRuntime) : base + script + proxyRuntime + html;
}
async function compileProjectPage(root, directory, path) {
  const vendor = fileURLToPath2(new URL("../vendor/", import.meta.url));
  const assets = JSON.parse(await readFile4(join3(vendor, "manifest.json"), "utf8"));
  const base = await realpath2(root), site = await contained(base, directory);
  return instrument(await snapshotCompiler(base, site, vendor, assets)(path), true);
}
async function createPreview(ui, configuredRoot, defaultDirectory = "www.noventrad.com", projectSync) {
  const referenceRoot = () => realpath2(configuredRoot);
  const vendor = fileURLToPath2(new URL("../vendor/", import.meta.url));
  const assets = JSON.parse(await readFile4(join3(vendor, "manifest.json"), "utf8"));
  const siteKeys = /* @__PURE__ */ new Set();
  async function readWebsite(directory, includeHtml = true) {
    const root = await referenceRoot();
    const manifest = await scanSite(root, directory, "https://website-builder.invalid");
    if (!includeHtml) return manifest;
    const site = await contained(root, directory);
    const compile = snapshotCompiler(root, site, vendor, assets);
    for (const page of manifest.pages) page.html = instrument(await compile(page.path), true);
    return manifest;
  }
  async function readPage(directory, path) {
    const root = await referenceRoot();
    const manifest = await readWebsite(directory, false);
    if (!manifest.pages.some((page) => page.path === path)) throw new Error("\u9875\u9762\u4E0D\u5728\u8BC6\u522B\u7ED3\u679C\u5185");
    const site = await contained(root, directory);
    return instrument(await snapshotCompiler(root, site, vendor, assets)(path), true);
  }
  const token = randomBytes2(24).toString("hex");
  let origin = "";
  const service = createServer(async (req, res) => {
    try {
      if (req.method !== "GET") {
        res.writeHead(405).end();
        return;
      }
      const url = new URL(req.url, origin);
      const prefix = `/${token}`;
      if (!url.pathname.startsWith(prefix + "/")) {
        res.writeHead(404).end();
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const route = url.pathname.slice(prefix.length);
      if (route === "/api/resource") {
        const resource = await resourceChunk(url.searchParams.get("url") || "", Math.max(0, Number(url.searchParams.get("offset") || 0)), url.searchParams.get("raw") === "true");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(resource));
        return;
      }
      if (route === "/canvas") {
        res.setHeader("Content-Type", mime[".html"]);
        res.setHeader("Content-Security-Policy", "frame-src blob: data:; object-src 'none'");
        res.end(render());
        return;
      }
      if (route === "/api/site") {
        const root = await referenceRoot();
        const directory = url.searchParams.get("directory") || defaultDirectory;
        const manifest = url.searchParams.get("embedded") === "1" ? await readWebsite(directory) : await scanSite(root, directory, origin + prefix);
        siteKeys.add(manifest.directory === "." ? "" : manifest.directory);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(manifest));
        return;
      }
      if (route === "/api/project-sync" && projectSync) {
        const value = await projectSync({ since: url.searchParams.get("since") || "none", known: JSON.parse(url.searchParams.get("known") || "{}"), waitMs: Number(url.searchParams.get("wait") || "20000") });
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(value));
        return;
      }
      if (route.startsWith("/vendor/")) {
        const name = route.slice("/vendor/".length);
        if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error("\u8D44\u6E90\u8DEF\u5F84\u65E0\u6548");
        const path = await contained(vendor, name);
        const type = mime[extname(path).toLowerCase()];
        if (!type) {
          res.writeHead(403).end();
          return;
        }
        res.setHeader("Content-Type", type);
        res.end(await readFile4(path));
        return;
      }
      if (route.startsWith("/files/")) {
        const root = await referenceRoot();
        const requested = decodeURIComponent(route.slice("/files/".length));
        if (requested.includes("\\") || requested.includes("\0") || requested.split("/").some((part) => part.startsWith("."))) throw new Error("\u4E0D\u53EF\u8BFB\u53D6\u6B64\u8DEF\u5F84");
        const path = await contained(root, requested);
        const type = mime[extname(path).toLowerCase()];
        if (!type) {
          res.writeHead(403).end();
          return;
        }
        const data2 = await readFile4(path);
        res.setHeader("Content-Type", type);
        if (/\.(html?|js|css|json)$/i.test(path)) {
          let text2 = data2.toString("utf8");
          for (const [remote, local] of process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES === "1" ? Object.entries(assets) : []) {
            text2 = text2.replaceAll(remote, `${origin}${prefix}/vendor/${local}`).replaceAll(remote.replaceAll("&", "&amp;"), `${origin}${prefix}/vendor/${local}`);
          }
          const key = [...siteKeys].sort((a, b) => b.length - a.length).find((key2) => !key2 || requested.startsWith(key2 + "/"));
          if (key !== void 0) {
            const base = `${prefix}/files/${key ? `${key.split("/").map(encodeURIComponent).join("/")}/` : ""}`;
            text2 = text2.replace(/(["'`])\/(?!\/)([^"'`\s<>]+\.(?:html?|css|js|json|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|ico)(?:[?#][^"'`\s<>]*)?)\1/gi, (_match, quote, path2) => `${quote}${base}${path2}${quote}`);
          }
          res.end(/\.html?$/i.test(path) ? instrument(text2) : text2);
        } else res.end(data2);
        return;
      }
      res.writeHead(404).end();
    } catch (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise((resolve4, reject) => {
    service.once("error", reject);
    service.listen(0, "127.0.0.1", resolve4);
  });
  const port = service.address().port;
  origin = `http://127.0.0.1:${port}`;
  function render() {
    const config = JSON.stringify({ api: `${origin}/${token}/api/site`, projectApi: `${origin}/${token}/api/project-sync`, resourceApi: `${origin}/${token}/api/resource`, origin, defaultDirectory }).replaceAll("<", "\\u003c");
    return ui.replace("</head>", `<script>window.__WEBSITE_BUILDER__=${config};</script></head>`);
  }
  return { origin, url: `http://localhost:${port}/${token}/canvas`, render, service, readWebsite, readPage };
}

// server/snapshot.ts
function previewScript(source, importBase) {
  const isMember = (node, name) => node?.type === "MemberExpression" && (!node.computed && node.property.name === name || node.computed && node.property.value === name);
  const isLocation = (node) => node?.type === "Identifier" && node.name === "location" || isMember(node, "location") && ["window", "self", "document"].includes(node.object?.name);
  const changes = [];
  function visit(node) {
    if (node.type === "ImportExpression") {
      const value = source.slice(node.source.start, node.source.end);
      changes.push({ start: node.start, end: node.end, text: `window.__websiteBuilderImport(${importBase ? `new URL(${value},${JSON.stringify(importBase)}).href` : value})` });
      return;
    }
    if (node.type === "AssignmentExpression" && (isLocation(node.left) || isMember(node.left, "href") && isLocation(node.left.object))) {
      changes.push({ start: node.start, end: node.end, text: `window.__websiteBuilderNavigate(${source.slice(node.right.start, node.right.end)})` });
      return;
    }
    if (node.type === "CallExpression" && ["assign", "replace"].some((name) => isMember(node.callee, name)) && isLocation(node.callee.object)) {
      changes.push({ start: node.start, end: node.end, text: `window.__websiteBuilderNavigate(${node.arguments[0] ? source.slice(node.arguments[0].start, node.arguments[0].end) : "''"})` });
      return;
    }
    if (node.type === "MemberExpression" && isLocation(node.object) && ["search", "pathname", "hash", "href", "origin", "host", "hostname", "protocol"].some((name) => isMember(node, name))) {
      changes.push({ start: node.start, end: node.end, text: `window.__websiteBuilderLocation.${node.computed ? node.property.value : node.property.name}` });
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach((child) => {
        if (child?.type) visit(child);
      });
      else if (value && typeof value === "object" && value.type) visit(value);
    }
  }
  try {
    visit(parse3(source, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true }));
  } catch {
    try {
      visit(parse3(source, { ecmaVersion: "latest", sourceType: "module" }));
    } catch {
      return source;
    }
  }
  for (const edit of changes.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return source;
}
var types2 = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".json": "application/json" };
async function replaceAsync(value, regex, replace) {
  const matches = [...value.matchAll(regex)];
  const values = await Promise.all(matches.map(replace));
  let index = 0;
  return value.replace(regex, () => values[index++]);
}
function snapshotCompiler(root, site, vendor, vendors) {
  const cache2 = /* @__PURE__ */ new Map();
  let documentFile = "";
  const missing = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#f4f5f4"/><path d="M122 120l20-24 16 16 18-28 20 36z" fill="#d1d8d3"/></svg>').toString("base64");
  async function asset(url, from, external = false) {
    const decoded = url.replaceAll("&amp;", "&");
    if (/^(data:|blob:|#)/i.test(decoded)) return decoded;
    let file;
    if (/^(?:https?:)?\/\//i.test(decoded)) {
      const remote = decoded.startsWith("//") ? `https:${decoded}` : decoded;
      if (!vendors[remote] || process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES !== "1") {
        if (!external && !/\.(?:m?js|css)(?:[?#]|$)/i.test(remote)) return remote;
        const resource = await proxyResource(remote);
        return `data:${resource.mime};base64,${resource.bytes.toString("base64")}`;
      }
      file = resolve3(vendor, vendors[remote]);
    } else file = decoded.startsWith("/") ? resolve3(site, decoded.slice(1).split(/[?#]/)[0]) : resolve3(dirname2(from), decoded.split(/[?#]/)[0]);
    const type = types2[extname2(file).toLowerCase()];
    if (!type) return url;
    const cacheKey = `${external ? "embedded" : "lazy"}:${file}`;
    if (!cache2.has(cacheKey)) cache2.set(cacheKey, (async () => {
      try {
        const safe = await contained(file.startsWith(vendor) ? vendor : root, file);
        if (!external && /^(?:image\/(?!svg)|video\/|audio\/)/.test(type)) return registerPreviewFile(safe, type);
        let bytes = await readFile5(safe);
        if (/\.css$/i.test(file)) bytes = Buffer.from(await transform(bytes.toString("utf8"), safe, true));
        else if (/\.js$/i.test(file) && !file.startsWith(vendor)) {
          bytes = Buffer.from(await transform(previewScript(bytes.toString("utf8")), documentFile || safe));
        }
        return `data:${type};base64,${bytes.toString("base64")}`;
      } catch {
        if (type.startsWith("image/") && decoded.startsWith("/img/") && basename2(site) === "www.noventrad.com") return `https://cdn.noventrad.com${decoded}`;
        return type.startsWith("image/") ? missing : `data:${type};base64,`;
      }
    })());
    return cache2.get(cacheKey);
  }
  async function transform(text2, from, css = false) {
    if (css) {
      text2 = await replaceAsync(text2, /@import\s+(['"])([^'"]+)\1/gi, async (match) => `@import url("${await asset(match[2], from, true)}")`);
      text2 = await replaceAsync(text2, /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, async (match) => `url("${await asset(match[2], from, true)}")`);
    }
    if (!css) text2 = await replaceAsync(text2, /(\b(?:from|import)\s*)(['"])((?:https?:)?\/\/[^'"]+)\2/g, async (match) => `${match[1]}${match[2]}${await asset(match[3], from, true)}${match[2]}`);
    return replaceAsync(text2, /(["'`])((?:https?:\/\/|\.{0,2}\/)?[^"'`\s<>]*\.(?:js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|mp3)(?:[?#][^"'`\s<>]*)?)\1/gi, async (match) => `${match[1]}${await asset(match[2], from)}${match[1]}`);
  }
  return async (path) => {
    const file = await contained(root, resolve3(site, path));
    documentFile = file;
    let html = await readFile5(file, "utf8");
    html = await replaceAsync(html, /<(?:script|link)\b[^>]*>/gi, async (match) => {
      if (/^<link/i.test(match[0]) && /\brel\s*=\s*["'](?:preconnect|dns-prefetch)["']/i.test(match[0])) return "";
      if (/^<link/i.test(match[0]) && !/\brel\s*=\s*["']stylesheet["']/i.test(match[0])) return match[0];
      const tag = await replaceAsync(match[0], /\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, async (attr) => `${attr[1]}=${attr[2]}${await asset(attr[3], file, true)}${attr[2]}`);
      return tag.replace(/\s+(?:integrity|crossorigin)\s*=\s*(["'])[^"']*\1/gi, "");
    });
    html = html.replace(/<meta\b[^>]*>/gi, (tag) => /http-equiv\s*=\s*["']?refresh\b/i.test(tag) ? "" : tag);
    html = html.replace(/\b(on\w+)\s*=\s*(["'])([\s\S]*?)\2/gi, (_match, name, quote, handler) => {
      const source = handler.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
      const rewritten = previewScript(source).replaceAll("&", "&amp;").replaceAll(quote, quote === '"' ? "&quot;" : "&#39;");
      return `${name}=${quote}${rewritten}${quote}`;
    });
    html = await replaceAsync(html, /\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, async (match) => {
      if (/\.html?(?:[?#]|$)/i.test(match[3])) return match[0];
      return `${match[1]}=${match[2]}${await asset(match[3], file)}${match[2]}`;
    });
    html = await replaceAsync(html, /\bsrcset\s*=\s*(["'])([^"']+)\1/gi, async (match) => {
      if (/data:/i.test(match[2])) return match[0];
      const candidates = await Promise.all(match[2].split(",").map(async (candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [await asset(url, file), ...descriptor].join(" ");
      }));
      return `srcset=${match[1]}${candidates.join(", ")}${match[1]}`;
    });
    for (const remote of process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES === "1" ? Object.keys(vendors) : []) html = html.replaceAll(remote.replaceAll("&", "&amp;"), await asset(remote, file)).replaceAll(remote, await asset(remote, file));
    html = await replaceAsync(html, /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, async (match) => `<script${match[1]}>${await transform(previewScript(match[2]), file)}</script>`);
    html = await replaceAsync(html, /<style\b([^>]*)>([\s\S]*?)<\/style>/gi, async (match) => `<style${match[1]}>${await transform(match[2], file, true)}</style>`);
    html = await replaceAsync(html, /\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi, async (match) => /url\(/i.test(match[2]) ? `style=${match[1]}${(await transform(match[2], file, true)).replaceAll(match[1], match[1] === '"' ? "&quot;" : "&#39;")}${match[1]}` : match[0]);
    html = html.replace(/<(?:img|source|video|audio|track|input|object|embed)\b[^>]*>/gi, (tag) => tag.replace(/\b(src|srcset|poster|data)\s*=\s*(["'])([^"']+)\2/gi, (attribute, name, quote, value) => /^(?:https?:)?\/\//i.test(value) ? `data-wb-${name}=${quote}${value}${quote}` : attribute));
    return html;
  };
}

// server/resource-proxy.ts
import { readFile as readFile6, stat as stat3 } from "fs/promises";
import { createHash as createHash2 } from "crypto";
var maximum = 64 * 1024 * 1024;
var privateAddress = (ip) => /^(?:0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|22[4-9]\.|2[3-5]\d\.)/.test(ip) || ip.includes(":") && (/^(?:::|f[cd]|fe[89ab])/i.test(ip) || ip.toLowerCase().includes("ffff:"));
var cache = /* @__PURE__ */ new Map();
var previewPrefix = "https://website-builder.invalid/preview-assets/";
var previewFiles = /* @__PURE__ */ new Map();
var previewBuffers = /* @__PURE__ */ new Map();
function registerPreviewBuffer(bytes, mime3) {
  const url = previewPrefix + createHash2("sha256").update(mime3).update(bytes).digest("hex");
  previewBuffers.delete(url);
  previewBuffers.set(url, { bytes, mime: mime3 });
  let size = [...previewBuffers.values()].reduce((sum, item) => sum + item.bytes.length, 0);
  for (const [key, item] of previewBuffers) {
    if (size <= 128 * 1024 * 1024) break;
    if (key !== url) {
      previewBuffers.delete(key);
      size -= item.bytes.length;
    }
  }
  return url;
}
async function registerPreviewFile(file, mime3) {
  const info = await stat3(file), version2 = `${info.size}:${info.mtimeMs}`;
  const url = previewPrefix + createHash2("sha256").update(file).update(version2).digest("hex");
  previewFiles.set(url, { file, mime: mime3, version: version2 });
  if (previewFiles.size > 8192) previewFiles.delete(previewFiles.keys().next().value);
  return url;
}
var mimeByPath = { js: "text/javascript", mjs: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif", gif: "image/gif", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", json: "application/json" };
function download(value, redirects = 0) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("\u8D44\u6E90\u4EE3\u7406\u4EC5\u63A5\u53D7\u65E0\u51ED\u636E\u7684 HTTP(S) \u5730\u5740");
  if (redirects > 6) throw new Error("\u8D44\u6E90\u91CD\u5B9A\u5411\u8FC7\u591A");
  const allowLocal = process.env.WEBSITE_BUILDER_PROXY_ALLOW_LOCAL === "1";
  if (!allowLocal && (url.hostname === "localhost" || isIP(url.hostname.replace(/^\[|\]$/g, "")) && privateAddress(url.hostname.replace(/^\[|\]$/g, "")))) throw new Error("\u5916\u90E8\u8D44\u6E90\u4EE3\u7406\u4E0D\u80FD\u8BBF\u95EE\u672C\u673A\u6216\u79C1\u6709\u7F51\u7EDC");
  return new Promise((resolve4, reject) => {
    const request = (url.protocol === "https:" ? https : http).get(url, { headers: { "User-Agent": "Mozilla/5.0 WebsiteBuilderPreview/0.5.2", "Accept": "*/*", "Accept-Encoding": "gzip, deflate, br" }, lookup: (hostname, options, callback) => lookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error, []);
      if (!allowLocal && addresses.some((item) => privateAddress(item.address))) return callback(new Error("\u5916\u90E8\u8D44\u6E90\u5730\u5740\u89E3\u6790\u5230\u79C1\u6709\u7F51\u7EDC"), []);
      if (options.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    }) }, (response) => {
      const status = response.statusCode || 502;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        download(new URL(response.headers.location, url).href, redirects + 1).then(resolve4, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`\u8D44\u6E90\u8BF7\u6C42\u5931\u8D25 (${status})\uFF1A${url.href}`));
        return;
      }
      let size = 0;
      const chunks = [];
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > maximum) response.destroy(new Error("\u8D44\u6E90\u8D85\u8FC7 64MB \u9650\u5236"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        try {
          let bytes = Buffer.concat(chunks);
          const encoding = response.headers["content-encoding"];
          const options = { maxOutputLength: maximum };
          if (encoding === "gzip") bytes = gunzipSync(bytes, options);
          else if (encoding === "br") bytes = brotliDecompressSync(bytes, options);
          else if (encoding === "deflate") bytes = inflateSync(bytes, options);
          const mime3 = (response.headers["content-type"] || mimeByPath[url.pathname.split(".").pop() || ""] || "application/octet-stream").split(";")[0];
          resolve4({ bytes, mime: mime3, url: url.href, status });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(2e4, () => request.destroy(new Error(`\u8D44\u6E90\u8BF7\u6C42\u8D85\u65F6\uFF1A${url.href}`)));
    request.on("error", reject);
  });
}
var replaceAsync2 = async (text2, pattern, fn) => {
  const matches = [...text2.matchAll(pattern)], values = await Promise.all(matches.map(fn));
  let i = 0;
  return text2.replace(pattern, () => values[i++]);
};
async function proxyResource(url, raw = false, chain = []) {
  url = new URL(url).href;
  const key = `${raw ? "raw" : "compiled"}:${url}`;
  if (url.startsWith(previewPrefix)) {
    const buffer = previewBuffers.get(url);
    if (buffer) return { ...buffer, url, status: 200 };
    const entry2 = previewFiles.get(url);
    if (!entry2) throw new Error("\u9884\u89C8\u8D44\u6E90\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u5BF9\u5E94\u9875\u9762");
    const info = await stat3(entry2.file);
    if (`${info.size}:${info.mtimeMs}` !== entry2.version) throw new Error("\u9884\u89C8\u8D44\u6E90\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u5BF9\u5E94\u9875\u9762");
    if (info.size > maximum) throw new Error("\u5355\u4E2A\u9884\u89C8\u8D44\u6E90\u8D85\u8FC764MB\u9650\u5236");
    return { bytes: await readFile6(entry2.file), mime: entry2.mime, url, status: 200 };
  }
  if (chain.includes(url)) throw new Error(`\u8D44\u6E90\u5FAA\u73AF\u4F9D\u8D56\uFF1A${url}`);
  const existing = cache.get(key);
  if (existing && Date.now() - existing.time < 6e5) return existing.value;
  const entry = { time: Date.now(), size: 0, value: Promise.resolve(null) };
  entry.value = (async () => {
    const resource = await download(url);
    if (!raw) {
      const embed = async (path) => {
        if (/^(?:data:|blob:|#)/i.test(path)) return path;
        const value = await proxyResource(new URL(path, resource.url).href, false, [...chain, url]);
        return `data:${value.mime};base64,${value.bytes.toString("base64")}`;
      };
      if (resource.mime === "text/css") {
        let css = resource.bytes.toString("utf8");
        css = await replaceAsync2(css, /@import\s+(['"])([^'"]+)\1/gi, async (match) => `@import url("${await embed(match[2])}")`);
        css = await replaceAsync2(css, /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, async (match) => `url("${await embed(match[2])}")`);
        resource.bytes = Buffer.from(css);
      } else if (resource.mime === "image/svg+xml") {
        let svg = resource.bytes.toString("utf8");
        svg = await replaceAsync2(svg, /\b((?:xlink:)?href)\s*=\s*(['"])([^'"]+)\2/gi, async (match) => `${match[1]}=${match[2]}${await embed(match[3])}${match[2]}`);
        svg = await replaceAsync2(svg, /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, async (match) => `url("${await embed(match[2])}")`);
        resource.bytes = Buffer.from(svg);
      } else if (/(?:java|ecma)script/.test(resource.mime) || /\.m?js$/i.test(new URL(resource.url).pathname)) {
        let js = previewScript(resource.bytes.toString("utf8"), resource.url);
        js = await replaceAsync2(js, /(\b(?:from\s*|import\s*(?:\(\s*)?|export\s+[^;]*?from\s*))(['"])([^'"]+)\2/g, async (match) => {
          if (!/^(?:https?:|\/|\.)/.test(match[3])) return match[0];
          return `${match[1]}${match[2]}${await embed(match[3])}${match[2]}`;
        });
        js = js.replace(/\bimport\.meta\.url\b/g, JSON.stringify(resource.url));
        resource.bytes = Buffer.from(js);
        resource.mime = "text/javascript";
      }
    }
    entry.size = resource.bytes.length;
    let size = [...cache.values()].reduce((sum, value) => sum + value.size, 0);
    for (const [key2, value] of cache) {
      if (size < 128 * 1024 * 1024) break;
      if (value !== entry) {
        cache.delete(key2);
        size -= value.size;
      }
    }
    return resource;
  })().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, entry);
  return entry.value;
}
async function resourceChunk(url, offset2 = 0, raw = false) {
  const resource = await proxyResource(url, raw);
  const bytes = resource.bytes.subarray(offset2, offset2 + 512 * 1024);
  return { base64: bytes.toString("base64"), mime: resource.mime, url: resource.url, status: resource.status, total: resource.bytes.length, offset: offset2, next: offset2 + bytes.length };
}

// server/project-service.ts
import { gzipSync } from "zlib";
function previewPayload(gzip) {
  return gzip.length <= 1e6 ? gzip : { resource: registerPreviewBuffer(Buffer.from(gzip, "base64"), "application/gzip") };
}
function compactProject(view) {
  return { project_id: view.project.id, thread_id: view.threadId, directory: view.directory, metadata_directory: view.metadataDirectory, name: view.project.name, language: view.project.language, brief: view.project.brief, pages: view.project.pages.map(({ path, status, error }) => ({ path, status, ...error ? { error } : {} })) };
}
function projectService(store) {
  const cache2 = /* @__PURE__ */ new Map();
  return async function sync(input) {
    let view = await store.reconcile(input.threadId);
    const known = input.known || {};
    const missing = view?.project.pages.some((page) => page.status === "ready" && known[page.path] !== page.version);
    if (!missing && (view?.revision || "none") === (input.since || "none")) view = await store.wait(input.since || "none", input.threadId, input.waitMs ?? 2e4);
    if (!view) return { revision: "none", unchanged: true };
    if (!missing && view.revision === input.since) return { revision: view.revision, unchanged: true };
    const manifest = { directory: view.project.id, name: view.project.name, projectId: view.project.id, threadId: view.threadId, revision: view.revision, order: "\u9879\u76EE\u9875\u9762\u8BA1\u5212", warnings: [], pages: view.project.pages.map((page) => ({ ...page, url: `https://website-builder.invalid/files/${view.project.id}/${page.path.split("/").map(encodeURIComponent).join("/")}` })) };
    const pages = {}, errors = {};
    let size = 0;
    for (const page of view.project.pages) {
      if (page.status !== "ready" || known[page.path] === page.version) continue;
      const key = `${view.project.id}:${page.path}`;
      try {
        let saved = cache2.get(key);
        if (!saved || saved.version !== page.version) {
          saved = { version: page.version, gzip: gzipSync(await compileProjectPage(store.root, view.project.id, page.path)).toString("base64") };
          cache2.set(key, saved);
        }
        const payload = previewPayload(saved.gzip), length = typeof payload === "string" ? payload.length : payload.resource.length;
        if (size > 0 && size + length > 28e5) break;
        pages[page.path] = payload;
        size += length;
      } catch (error) {
        errors[page.path] = error.message;
      }
    }
    let cacheBytes = [...cache2.values()].reduce((sum, item) => sum + item.gzip.length, 0);
    for (const [key, value] of cache2) {
      if (cacheBytes <= 24e6) break;
      cache2.delete(key);
      cacheBytes -= value.gzip.length;
    }
    return { revision: view.revision, manifest, pages, errors, projects: await store.list() };
  };
}

// server/commerce.ts
import { readFile as readFile7, realpath as realpath3 } from "fs/promises";
import { join as join4, relative as relative3, sep as sep3, isAbsolute as isAbsolute3 } from "path";
import { createHash as createHash3 } from "crypto";
async function existingFile(directory, path) {
  try {
    const file = await realpath3(join4(directory, path));
    const rel = relative3(await realpath3(directory), file);
    if (rel === ".." || rel.startsWith(`..${sep3}`) || isAbsolute3(rel)) throw new Error("\u5546\u54C1\u6587\u4EF6\u4E0D\u80FD\u6307\u5411\u9879\u76EE\u5916\u90E8");
    return await readFile7(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
function productData(source) {
  const ast = parse3(source, { ecmaVersion: "latest" });
  const literal2 = (node) => {
    if (node.type === "Literal") return node.value;
    if (node.type === "ArrayExpression") return node.elements.map(literal2);
    if (node.type === "ObjectExpression") {
      return Object.fromEntries(node.properties.map((property) => {
        if (property.type !== "Property" || property.computed || property.method) {
          throw new Error("\u5546\u54C1\u6570\u636E\u5FC5\u987B\u4E3A\u7EAF\u5BF9\u8C61\uFF0C\u4E0D\u80FD\u5305\u542B\u6267\u884C\u903B\u8F91");
        }
        return [property.key.name ?? property.key.value, literal2(property.value)];
      }));
    }
    if (node.type === "UnaryExpression" && node.operator === "-" && node.argument.type === "Literal") {
      return -node.argument.value;
    }
    throw new Error("\u73B0\u6709 data.js \u4E0D\u662F\u7EAF\u5B57\u9762\u91CF\u6570\u636E\uFF1B\u8BF7\u4FDD\u7559\u5E76\u5728\u6D4F\u89C8\u5668\u9A8C\u8BC1\uFF0C\u4E0D\u80FD\u81EA\u52A8\u8986\u76D6");
  };
  const assignment = ast.body.find((node) => {
    const left = node.expression?.left;
    return node.expression?.type === "AssignmentExpression" && left?.type === "MemberExpression" && left.object.name === "window" && (left.property.name || left.property.value) === "productData";
  });
  if (!assignment) throw new Error("\u672A\u627E\u5230 window.productData \u6570\u7EC4");
  const result = literal2(assignment.expression.right);
  if (!Array.isArray(result)) throw new Error("window.productData \u5FC5\u987B\u662F\u6570\u7EC4");
  return result;
}
function validateProducts(products, generated = false) {
  const ids = /* @__PURE__ */ new Set();
  const failures = [];
  for (const [index, product] of products.entries()) {
    const fail = (message) => failures.push(`\u5546\u54C1 ${index + 1}\uFF1A${message}`);
    if (!product || typeof product !== "object") {
      fail("\u4E0D\u662F\u5546\u54C1\u5BF9\u8C61");
      continue;
    }
    if (typeof product.id !== "string" || !product.id || ids.has(product.id)) fail("ID \u5FC5\u987B\u662F\u552F\u4E00\u975E\u7A7A\u5B57\u7B26\u4E32");
    if (generated && !/^B[A-Z0-9]{9}$/.test(product.id)) fail("Mock ID \u5FC5\u987B\u4E3A B + 9 \u4F4D\u5927\u5199\u5B57\u6BCD\u6570\u5B57");
    ids.add(product.id);
    for (const field of ["name", "brand", "category", "main_image", "description", "monthly_sales"]) {
      if (typeof product[field] !== "string" || !product[field].trim()) fail(`${field} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32`);
    }
    if (!Number.isFinite(product.final_price) || product.final_price < 0) fail("final_price \u5FC5\u987B\u662F\u975E\u8D1F\u6570\u5B57");
    if (!Number.isFinite(product.rating) || product.rating < 0 || product.rating > 5) fail("rating \u5FC5\u987B\u5728 0\u20135 \u4E4B\u95F4");
    if (!Number.isInteger(product.reviews_count) || product.reviews_count < 0) fail("reviews_count \u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570");
    if (!Array.isArray(product.images) || !product.images.length || product.images.some((image) => typeof image !== "string" || !image)) fail("images \u5FC5\u987B\u5305\u542B\u56FE\u7247\u8DEF\u5F84");
    if (!Array.isArray(product.features) || !product.features.length || product.features.some((feature) => typeof feature !== "string")) fail("features \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\u6570\u7EC4");
    if (!Array.isArray(product.specifications) || !product.specifications.length || product.specifications.some((item) => typeof item?.key !== "string" || typeof item?.value !== "string")) fail("specifications \u5FC5\u987B\u4E3A {key,value} \u6570\u7EC4");
    if (product.original_price != null) {
      if (!Number.isFinite(product.original_price) || product.original_price <= product.final_price) fail("original_price \u5FC5\u987B\u5927\u4E8E\u552E\u4EF7");
      const expected = Math.round((1 - product.final_price / product.original_price) * 100);
      if (product.discount !== `${expected}%`) fail("discount \u5FC5\u987B\u4E0E\u552E\u4EF7/\u539F\u4EF7\u8BA1\u7B97\u4E00\u81F4");
    } else if (product.discount) fail("\u65E0\u539F\u4EF7\u65F6\u4E0D\u80FD\u6807\u6CE8\u6298\u6263");
    for (const field of ["variants", "variant_options", "comments"]) {
      if (!Array.isArray(product[field])) fail(`${field} \u5FC5\u987B\u662F\u6570\u7EC4`);
    }
    for (const comment of Array.isArray(product.comments) ? product.comments : []) {
      if (typeof comment.date !== "string" || !Number.isFinite(Date.parse(comment.date)) || !Number.isFinite(comment.rating) || comment.rating < 0 || comment.rating > 5 || typeof comment.content !== "string" || typeof comment.user_name !== "string") fail("\u8BC4\u8BBA\u5B57\u6BB5\u4E0D\u5B8C\u6574");
    }
  }
  if (failures.length) throw new Error(failures.slice(0, 12).join("\n"));
  return { count: products.length, brands: new Set(products.map((item) => item.brand)).size, categories: new Set(products.map((item) => item.category)).size };
}
function validateSDKProducts(products) {
  const ids = /* @__PURE__ */ new Set();
  for (const [index, item] of products.entries()) {
    if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id) || typeof item.name !== "string" || !item.name.trim() || typeof item.category !== "string" || !item.category.trim() || !Number.isFinite(item.final_price) || item.final_price < 0) throw Error(`\u5BFC\u5165\u5546\u54C1${index + 1}\u4E0D\u7B26\u5408SDK\u6838\u5FC3\u5B57\u6BB5\u5951\u7EA6`);
    ids.add(item.id);
  }
  return { count: products.length, brands: new Set(products.map((item) => item.brand).filter(Boolean)).size, categories: new Set(products.map((item) => item.category)).size };
}
function generateProducts(input) {
  const samples = input.products || [];
  if (!samples.length) throw new Error("\u8BF7\u63D0\u4F9B\u4E0E\u54C1\u724C\u76F8\u7B26\u7684 products \u6837\u672C\uFF0C\u4E0D\u80FD\u81EA\u52A8\u5957\u7528\u65E0\u5173\u884C\u4E1A\u6570\u636E");
  const count = input.count ?? 24;
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error("count \u5FC5\u987B\u4E3A 1\u2013200\uFF0C\u5E38\u89C4\u6F14\u793A\u5EFA\u8BAE 20\u201350");
  const products = Array.from({ length: count }, (_, index) => {
    const sample = samples[index % samples.length];
    if (typeof sample.final_price !== "number" || !sample.main_image && !sample.images?.length) {
      throw new Error("\u6BCF\u4E2A\u6837\u672C\u5FC5\u987B\u63D0\u4F9B\u6570\u503C final_price \u548C main_image/images\uFF1B\u4E0D\u80FD\u4F2A\u9020\u5546\u54C1\u56FE\u7247");
    }
    const digest = createHash3("sha256").update(`${input.seed || input.project_id}:${index}`).digest("hex").toUpperCase();
    const product = {
      ...sample,
      id: `B${digest.slice(0, 9)}`,
      name: index < samples.length ? sample.name : `${sample.name} ${String(Math.floor(index / samples.length) + 1).padStart(2, "0")}`,
      main_image: sample.main_image || sample.images[0],
      images: sample.images?.length ? sample.images.slice(0, 5) : [sample.main_image],
      final_price: Math.round(sample.final_price * 100) / 100,
      rating: sample.rating ?? Math.round((3 + parseInt(digest.slice(9, 11), 16) / 255 * 2) * 10) / 10,
      reviews_count: sample.reviews_count ?? parseInt(digest.slice(11, 15), 16) % 501,
      monthly_sales: sample.monthly_sales || `${parseInt(digest.slice(15, 17), 16) + 1}+`,
      features: sample.features || [sample.description],
      specifications: sample.specifications || [{ key: "Brand", value: sample.brand }, { key: "Category", value: sample.category }],
      variants: sample.variants || [],
      variant_options: sample.variant_options || [],
      comments: sample.comments || []
    };
    if (sample.original_price == null && index % 5 < 2) product.original_price = Math.round(product.final_price / 0.85 * 100) / 100;
    if (product.original_price > product.final_price) product.discount = `${Math.round((1 - product.final_price / product.original_price) * 100)}%`;
    else {
      delete product.original_price;
      delete product.discount;
    }
    return product;
  });
  validateProducts(products, true);
  return products;
}
async function prepareCommerce(store, skillRoot, input) {
  const view = await store.get(input.thread_id);
  if (!view || view.project.id !== input.project_id) throw new Error("\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE\u4E0D\u5339\u914D\uFF0C\u8BF7\u5148\u6253\u5F00\u9879\u76EE");
  new Intl.NumberFormat(input.locale || "en-US", { style: "currency", currency: input.currency || "USD" });
  const existing = await existingFile(view.directory, "js/data.js");
  let imported = false;
  try {
    const record = JSON.parse(await readFile7(join4(view.metadataDirectory, "website-builder.import.json"), "utf8"));
    imported = ["sdk-import-v1", "sdk-import-v2"].includes(record.schema) && !!existing && record.runtime_data_sha256 === createHash3("sha256").update(existing).digest("hex");
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  const validateExisting = (products) => imported ? validateSDKProducts(products) : validateProducts(products);
  if (input.action === "validate") {
    if (!existing) throw new Error("\u7F3A\u5C11 js/data.js");
    return { source: "existing", ...validateExisting(productData(existing)) };
  }
  const files = [];
  let source = "generated", count = 0;
  if (input.api_url) {
    const url = new URL(input.api_url);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("API \u6570\u636E\u6E90\u5FC5\u987B\u4F7F\u7528 HTTP(S)");
    source = "api";
  } else if (existing && !input.regenerate) {
    const products = productData(existing);
    if (products.length) {
      validateExisting(products);
      source = "existing";
      count = products.length;
    }
  }
  if (source === "generated") {
    const products = generateProducts(input);
    count = products.length;
    files.push({ path: "js/data.js", content: `window.productData = ${JSON.stringify(products, null, 2)};

window.storeData = {
  getAll() {
    return window.SDK.list().result();
  },
  getById(id) {
    return window.SDK.get(String(id));
  },
  getByCategory(category) {
    return window.SDK.categories(category).result();
  },
  formatPrice(value) {
    return window.SDK.price(value);
  },
  toCartItem(product) {
    return {
      id: String(product.id),
      name: product.name,
      image: product.main_image,
      price: product.final_price
    };
  }
};
` });
  }
  const kept = [];
  for (const name of ["sdk.js", "ec-sdk.js"]) {
    const path = `js/${name}`;
    if (await existingFile(view.directory, path) !== void 0) kept.push(path);
    else files.push({ path, content: await readFile7(join4(skillRoot, "assets/commerce", name), "utf8") });
  }
  const configuration = "js/app.js";
  const configDefaults = { currency: input.currency || "USD", locale: input.locale || "en-US", storageKey: `website-builder:${view.project.id}` };
  if (await existingFile(view.directory, configuration) !== void 0) kept.push(configuration);
  else files.push({ path: configuration, content: `window.commerceConfig = ${JSON.stringify(configDefaults)};
` });
  if (files.length) await store.write(input.thread_id, files);
  return {
    project_id: view.project.id,
    source,
    count,
    written: files.map((file) => file.path),
    kept,
    config_defaults: configDefaults,
    configuration_note: "New projects keep currency/locale/storageKey in js/app.js, not a separate commerce-config.js. Merge missing defaults without replacing existing settings, keep Tailwind config first, and initialize configuration before SDK/APP.",
    ...source === "api" ? { next: "\u751F\u6210 API \u5B57\u6BB5\u9002\u914D\u5668\uFF0C\u6570\u636E\u5C31\u7EEA\u540E\u8BBE\u7F6E window.productData \u5E76 SDK.init\uFF1B\u672A\u751F\u6210 mock \u6570\u636E\u3002" } : {},
    account_contract: "Bundled APP.account.register/login/update are async demo methods; await results. Existing SDKs are preserved: inspect their contract before use."
  };
}

// server/screenshot.ts
import { createServer as createServer2 } from "http";
import { readFile as readFile8, mkdir as mkdir2, writeFile as writeFile2 } from "fs/promises";
import { dirname as dirname3, extname as extname3, join as join5 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { randomBytes as randomBytes3 } from "crypto";
var mime2 = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf" };
async function screenshotPage(store, input) {
  const view = await store.get(input.thread_id);
  if (!view || view.project.id !== input.project_id) throw new Error("\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE\u4E0D\u5339\u914D");
  const planned = view.project.pages.find((page) => page.path === input.path.split(/[?#]/)[0]);
  if (!planned || planned.status !== "ready") throw new Error("\u9875\u9762\u4E0D\u5B58\u5728\u6216\u5C1A\u672A\u751F\u6210\u5B8C\u6210");
  const width = input.width ?? 1280;
  if (!Number.isInteger(width) || width < 320 || width > 2560) throw new Error("width \u5FC5\u987B\u4E3A320\u20132560");
  const runtime2 = new URL("../runtime/playwright-core/index.mjs", import.meta.url).href;
  const { chromium } = await import(
    /* @vite-ignore */
    runtime2
  );
  const vendor = fileURLToPath3(new URL("../vendor/", import.meta.url));
  const vendors = JSON.parse(await readFile8(join5(vendor, "manifest.json"), "utf8"));
  const token = randomBytes3(24).toString("hex");
  const prefix = `/${token}/`;
  const service = createServer2(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method !== "GET" || !url.pathname.startsWith(prefix)) {
        res.writeHead(404).end();
        return;
      }
      const name = decodeURIComponent(url.pathname.slice(prefix.length));
      if (name.split("/").some((part) => part.startsWith(".")) || name.includes("\\")) throw Error("\u4E0D\u53EF\u8BFB\u53D6\u6B64\u8DEF\u5F84");
      const file = await contained(view.directory, name);
      res.setHeader("Content-Type", mime2[extname3(file)] || "application/octet-stream");
      res.end(await readFile8(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve4) => service.listen(0, "127.0.0.1", resolve4));
  const origin = `http://127.0.0.1:${service.address().port}`;
  let browser;
  let timer;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const work = async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      page.setDefaultTimeout(15e3);
      const failures = /* @__PURE__ */ new Set();
      page.on("pageerror", (error) => failures.add(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400) failures.add(`${response.status()} ${response.url()}`);
      });
      page.on("requestfailed", (request) => failures.add(`\u52A0\u8F7D\u5931\u8D25 ${request.url()}`));
      await page.route("**/*", async (route) => {
        const request = route.request(), url = request.url();
        if (request.method() !== "GET" || request.isNavigationRequest() && !url.startsWith(origin + prefix)) {
          await route.abort();
          return;
        }
        if (url.startsWith(origin + prefix)) {
          await route.continue();
          return;
        }
        try {
          if (vendors[url] && process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES === "1") await route.fulfill({ body: await readFile8(await contained(vendor, vendors[url])), contentType: mime2[extname3(vendors[url])] });
          else {
            const resource = await proxyResource(url);
            await route.fulfill({ body: resource.bytes, contentType: resource.mime });
          }
        } catch (error) {
          failures.add(error.message);
          await route.abort();
        }
      });
      await page.goto(origin + prefix + input.path, { waitUntil: "load", timeout: 3e4 });
      await page.evaluate(async () => {
        await window.websiteReady;
        await Promise.all([...new Set([...document.querySelectorAll("*")].map((el) => el.localName).filter((name) => name.includes("-")))].map((name) => customElements.whenDefined(name)));
        await document.fonts.ready;
      });
      await page.waitForLoadState("networkidle", { timeout: 15e3 });
      await page.evaluate(async () => {
        document.querySelectorAll("img").forEach((image) => image.loading = "eager");
        let lastHeight = 0, stable2 = 0;
        for (let step = 0; step < 100; step++) {
          const height = document.documentElement.scrollHeight;
          window.scrollTo(0, Math.min(step * 700, height));
          await new Promise((resolve4) => setTimeout(resolve4, 60));
          if (step * 700 >= height && height === lastHeight) stable2++;
          else stable2 = 0;
          if (stable2 >= 3) break;
          lastHeight = height;
          if (step === 99) throw Error("\u61D2\u52A0\u8F7D\u9875\u9762\u672A\u6536\u655B\uFF0C\u65E0\u6CD5\u622A\u53D6\u5B8C\u6574\u56FE\u7247");
        }
        await Promise.all([...document.images].map(async (image) => {
          await image.decode();
          if (!image.naturalWidth) throw Error(`\u56FE\u7247\u672A\u52A0\u8F7D: ${image.currentSrc}`);
        }));
        const urls = /* @__PURE__ */ new Set();
        document.querySelectorAll("*").forEach((element) => {
          const image = getComputedStyle(element).backgroundImage;
          for (const match of image.matchAll(/url\(["']?(.*?)["']?\)/g)) urls.add(match[1]);
        });
        await Promise.all([...urls].map((url) => new Promise((resolve4, reject) => {
          const image = new Image();
          image.onload = () => resolve4();
          image.onerror = () => reject(Error(`\u80CC\u666F\u56FE\u7247\u672A\u52A0\u8F7D: ${url}`));
          image.src = url;
        })));
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle", { timeout: 15e3 });
      let previous = "", stable = 0;
      for (let attempt = 0; attempt < 40 && stable < 4; attempt++) {
        const signature = await page.evaluate(() => JSON.stringify({ height: document.documentElement.scrollHeight, text: document.body.innerText, images: [...document.images].map((image) => image.currentSrc), boxes: [...document.body.querySelectorAll("*")].map((el) => {
          const r = el.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height];
        }) }));
        stable = signature === previous ? stable + 1 : 0;
        previous = signature;
        await page.waitForTimeout(150);
      }
      if (stable < 4) throw Error("\u9875\u9762\u5E03\u5C40\u5C1A\u672A\u7A33\u5B9A");
      if (failures.size) throw Error(`\u9875\u9762\u672A\u5B8C\u6574\u6E32\u67D3\uFF1A${[...failures].slice(0, 5).join("; ")}`);
      const bytes = await page.screenshot({ fullPage: true, type: "png", animations: "disabled" });
      const path = join5(view.metadataDirectory, "artifacts/screenshots", `${input.path.split(/[?#]/)[0].replace(/[^a-zA-Z0-9_-]/g, "-")}-${width}-${Date.now()}-${randomBytes3(3).toString("hex")}.png`);
      await mkdir2(dirname3(path), { recursive: true });
      await writeFile2(path, bytes);
      return { path, width, page: input.path, bytes };
    };
    return await Promise.race([work(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error("\u5B8C\u6574\u9875\u9762\u622A\u56FE\u8D85\u65F6\uFF1A\u672A\u83B7\u5F97\u52A0\u8F7D\u5B8C\u6210\u7684\u7A33\u5B9A\u9875\u9762")), 6e4);
    })]);
  } finally {
    if (timer) clearTimeout(timer);
    if (browser) await browser.close();
    service.closeAllConnections();
    await new Promise((resolve4) => service.close(() => resolve4()));
  }
}

// server/product-import.ts
import { readFile as readFile9, stat as stat4 } from "fs/promises";
import { isAbsolute as isAbsolute4, join as join6 } from "path";
import { createHash as createHash4 } from "crypto";
import { runInNewContext } from "vm";
var valueAt = (item, path) => path.split(".").reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : void 0, item);
var text = (value) => typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
function amount(value, locale) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : void 0;
  if (typeof value !== "string") return void 0;
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6), group = parts.find((part) => part.type === "group")?.value, decimal = parts.find((part) => part.type === "decimal")?.value;
  let result = value.trim().replace(/^(?:[A-Z]{3}|[$€£¥])\s*|\s*(?:[A-Z]{3}|[$€£¥])$/g, "");
  if (group) result = result.split(group).join("");
  if (decimal && decimal !== ".") result = result.replace(decimal, ".");
  if (!/^\d+(?:\.\d+)?$/.test(result)) return void 0;
  const number = Number(result);
  return Number.isFinite(number) ? number : void 0;
}
function imageBase(input) {
  if (input.image_cdn) {
    const url = new URL(input.image_cdn);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw Error("\u56FE\u7247CDN\u5FC5\u987B\u4F7F\u7528\u65E0\u51ED\u636EHTTP(S)\u5730\u5740");
    return url.href.replace(/\/?$/, "/");
  }
  if (!input.website_domain) return void 0;
  const domain = new URL(/^https?:\/\//.test(input.website_domain) ? input.website_domain : `https://${input.website_domain}`);
  if (!/^https?:$/.test(domain.protocol) || domain.username || domain.password || domain.port) throw Error("\u7F51\u7AD9\u57DF\u540D\u65E0\u6548");
  const host = domain.hostname.replace(/^www\./i, "");
  return `https://${host.startsWith("cdn.") ? host : `cdn.${host}`}/`;
}
function normalizeImage(value) {
  if (value && typeof value === "object") value = value.url ?? value.src ?? value.hi_res ?? value.large ?? value.link;
  const path = text(value);
  if (!path) return "";
  if (/^(?:https?:)?\/\//i.test(path)) {
    const url = new URL(path.startsWith("//") ? `https:${path}` : path);
    return url.username || url.password ? "" : path;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.includes("\\")) return "";
  return path;
}
function normalize(source, input) {
  let rows = source;
  if (!Array.isArray(rows)) rows = source?.products ?? source?.productData ?? source?.items ?? source?.data?.products ?? source?.data?.items ?? source?.data;
  if (!Array.isArray(rows) || !rows.length) throw Error("\u672A\u8BC6\u522B\u5230\u975E\u7A7A\u5546\u54C1\u6570\u7EC4\uFF08\u652F\u6301\u6570\u7EC4/products/productData/items/data\u7B49\u5305\u88C5\uFF09");
  if (rows.length > 1e5) throw Error("\u5546\u54C1\u6570\u91CF\u8D85\u8FC7100000\u6761\u5BFC\u5165\u4E0A\u9650");
  const base = imageBase(input), locale = input.locale || "en-US", seen = /* @__PURE__ */ new Set();
  const aliases = { id: ["id", "asin", "product_id", "sku"], name: ["name", "title", "product_name"], category: ["category", "category_name", "categories"], brand: ["brand", "brand_name"], final_price: ["final_price", "price.value", "price.amount", "price.current", "price"], main_image: ["main_image", "image", "image_url", "thumbnail"], images: ["images", "image_urls"], description: ["description", "product_description"] };
  const pick = (row, key) => {
    for (const path of input.field_map?.[key] ? [input.field_map[key]] : aliases[key] || [key]) {
      const value = valueAt(row, path);
      if (value !== void 0 && value !== null && value !== "") return value;
    }
  };
  const products = rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw Error(`\u5546\u54C1${index + 1}\u4E0D\u662F\u5BF9\u8C61`);
    const id = text(pick(row, "id")), name = text(pick(row, "name")), price = amount(pick(row, "final_price"), locale);
    if (!id || !name || price === void 0 || seen.has(id)) throw Error(`\u5546\u54C1${index + 1}\u7684ID/\u540D\u79F0/\u6570\u503C\u4EF7\u683C\u4E0D\u53EF\u8BC6\u522B\u6216ID\u91CD\u590D`);
    seen.add(id);
    const rawCategory = pick(row, "category"), category = text(Array.isArray(rawCategory) ? rawCategory[0] : rawCategory) || "Uncategorized";
    const images = pick(row, "images"), paths = (Array.isArray(images) ? images : []).map((item) => normalizeImage(item)).filter(Boolean);
    const mainImage = normalizeImage(pick(row, "main_image")) || paths[0] || "";
    const result = { id, name, brand: text(pick(row, "brand")), category, final_price: price, main_image: mainImage, images: [...new Set([mainImage, ...paths].filter(Boolean))], description: text(pick(row, "description")), features: Array.isArray(row.features) ? row.features : [], specifications: Array.isArray(row.specifications) ? row.specifications : [], variants: Array.isArray(row.variants) ? row.variants : [], variant_options: Array.isArray(row.variant_options) ? row.variant_options : [], comments: Array.isArray(row.comments) ? row.comments : [] };
    for (const field of ["subcategory", "sub_category", "product_type", "type", "monthly_sales", "parent_category"]) {
      const value = text(pick(row, field));
      if (value) result[field] = value;
    }
    for (const field of ["features", "specifications", "variants", "variant_options", "comments"]) {
      const value = pick(row, field);
      result[field] = Array.isArray(value) ? value : [];
    }
    for (const field of ["rating", "reviews_count"]) {
      const value = pick(row, field);
      if (value !== void 0) {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0 && (field !== "rating" || number <= 5)) result[field] = number;
        else delete result[field];
      }
    }
    const original = amount(pick(row, "original_price"), locale);
    if (original !== void 0 && original > price) {
      result.original_price = original;
      result.discount = `${Math.round((1 - price / original) * 100)}%`;
    } else {
      delete result.original_price;
      delete result.discount;
    }
    return result;
  });
  return { products, base };
}
function classify(products, sdk) {
  const byId = new Map(products.map((item) => [item.id, item]));
  const group = (label, items) => ({ id: "", label, categories: [...new Set(items.map((item) => item.category))], product_ids: items.map((item) => item.id), count: items.length, image: items.find((item) => item.main_image)?.main_image || "" });
  const sorted = (groups2) => groups2.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  let groups = sorted(sdk.categories().map((category) => group(category, sdk.list().filter({ category }).result())));
  if (groups.length > 6) throw Error("\u4E8C\u6B21\u5206\u7C7B\u5C1A\u672A\u6536\u655B\u5230\u4E0D\u8D85\u8FC76\u4E2A\u4E3B\u8981\u5206\u7C7B");
  while (groups.length < 5) {
    let changed = false;
    for (const parent of [...groups]) {
      const rows = parent.product_ids.map((id) => byId.get(id));
      for (const key of ["subcategory", "sub_category", "product_type", "type", "brand"]) {
        const buckets = /* @__PURE__ */ new Map();
        for (const row of rows) {
          const label = text(row[key]) || "Other";
          buckets.set(label, [...buckets.get(label) || [], row]);
        }
        if (buckets.size < 2) continue;
        let children = sorted([...buckets].map(([label, items]) => group(`${parent.label} / ${label}`, items)));
        const capacity = 6 - (groups.length - 1);
        if (children.length > capacity) {
          const tail = children.slice(capacity - 1).flatMap((item) => item.product_ids.map((id) => byId.get(id)));
          children = [...children.slice(0, capacity - 1), group(`${parent.label} / Other`, tail)];
        }
        groups = groups.flatMap((item) => item === parent ? children : [item]);
        changed = true;
        break;
      }
      if (changed) break;
    }
    if (!changed) break;
  }
  return groups.map((item, index) => ({ ...item, id: `category-${String(index + 1).padStart(2, "0")}` }));
}
async function importProducts(store, skillRoot, input) {
  if (input.action && !["inspect", "import"].includes(input.action)) throw Error("action\u5FC5\u987B\u4E3Ainspect\u6216import");
  const view = await store.get(input.thread_id);
  if (!view || view.project.id !== input.project_id) throw Error("\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE\u4E0D\u5339\u914D");
  if (Number(Boolean(input.file_path)) + Number(input.source_json !== void 0) !== 1) throw Error("file_path\u4E0Esource_json\u5FC5\u987B\u4E14\u53EA\u80FD\u63D0\u4F9B\u4E00\u4E2A");
  let source;
  if (input.file_path) {
    if (!isAbsolute4(input.file_path) || !/\.json$/i.test(input.file_path)) throw Error("\u9700\u8981\u7528\u6237\u63D0\u4F9B\u7684JSON\u6587\u4EF6\u7EDD\u5BF9\u8DEF\u5F84");
    const info = await stat4(input.file_path);
    if (info.size > 64 * 1024 * 1024) throw Error("JSON\u6587\u4EF6\u8D85\u8FC764MB\u8BFB\u53D6\u4E0A\u9650");
    source = await readFile9(input.file_path, "utf8");
  } else {
    source = input.source_json;
    if (Buffer.byteLength(source) > 64 * 1024 * 1024) throw Error("JSON\u8D85\u8FC764MB\u8BFB\u53D6\u4E0A\u9650");
  }
  imageBase(input);
  const fingerprint = createHash4("sha256").update(source).digest("hex");
  let normalized;
  try {
    normalized = normalize(JSON.parse(source.replace(/^\uFEFF/, "")), input);
  } catch (error) {
    return { mode: "mock", fallback: true, next_skill: "generate-mock-data", reason: error.message, written: [], source_sha256: fingerprint, note: "\u539F\u59CBJSON\u548C\u73B0\u6709\u5546\u54C1\u6570\u636E\u672A\u6539\u5199\uFF1B\u4E3B\u6280\u80FD\u63A5\u7EEDMock Data\u5DE5\u4F5C\u6D41\uFF0C\u4E0D\u628A\u5931\u8D25\u5BFC\u5165\u5192\u5145\u6210\u529F\u3002" };
  }
  const window2 = { productData: normalized.products };
  runInNewContext(await readFile9(join6(skillRoot, "assets/commerce/sdk.js"), "utf8"), { window: window2, Intl }, { timeout: 2e3 });
  const config = { currency: input.currency || "USD", locale: input.locale || "en-US", storageKey: `website-builder:${view.project.id}` };
  window2.SDK.init(normalized.products, config);
  const sourceCategories = window2.SDK.categories();
  const offset2 = input.category_offset ?? 0, limit = input.category_limit ?? 200;
  if (!Number.isInteger(offset2) || offset2 < 0 || !Number.isInteger(limit) || limit < 1 || limit > 200) throw Error("\u5206\u7C7B\u6458\u8981\u5206\u9875\u53C2\u6570\u65E0\u6548");
  const category_page = { offset: offset2, limit, total: sourceCategories.length, next_offset: offset2 + limit < sourceCategories.length ? offset2 + limit : null };
  const sourceCounts = sourceCategories.map((name) => ({ name, count: window2.SDK.list().filter({ category: name }).count() }));
  let mapping = input.category_map;
  if (!mapping && sourceCategories.length > 6) {
    const derived = /* @__PURE__ */ Object.create(null);
    let consistent = true;
    for (const item of normalized.products) {
      const parent = text(item.parent_category);
      if (!parent || derived[item.category] && derived[item.category] !== parent) {
        consistent = false;
        break;
      }
      derived[item.category] = parent;
    }
    const count = new Set(Object.values(derived)).size;
    if (consistent && count >= 2 && count <= 6) mapping = derived;
  }
  const missing = mapping ? sourceCategories.filter((name) => !text(mapping[name])) : sourceCategories;
  if (mapping && missing.length || sourceCategories.length > 6 && !mapping || mapping && new Set(Object.values(mapping).map(text)).size > 6) {
    return { mode: "classification_required", fallback: false, written: [], product_count: window2.SDK.count(), source_category_count: sourceCategories.length, category_count: sourceCategories.length, source_categories: sourceCounts.slice(offset2, offset2 + limit), category_page, categories_truncated: sourceCounts.length > 200, needs_secondary_classification: true, missing_categories: missing.slice(offset2, offset2 + limit), image_cdn: normalized.base || null, source_sha256: fingerprint, note: "\u5546\u54C1\u6570\u636E\u53EF\u8BC6\u522B\uFF1B\u8BF7\u6839\u636E\u539F\u5206\u7C7B\u6458\u8981\u63D0\u4EA4\u8986\u76D6\u5168\u90E8\u6E90\u5206\u7C7B\u7684category_map\uFF0C\u5408\u5E76\u4E3A\u7EA65\u20136\u4E2A\u6709\u610F\u4E49\u7684\u4E3B\u8981\u5206\u7C7B\uFF0C\u518D\u8C03\u7528\u672C\u5DE5\u5177\u3002\u4E0D\u8981\u6CBF\u7528\u524D5\u6E90\u7C7B+More\uFF0C\u4E0D\u8F6CMock\uFF0C\u4E0D\u6539\u6E90\u6587\u4EF6\u3002" };
  }
  for (const item of normalized.products) {
    item.source_category = item.category;
    if (mapping) item.category = text(mapping[item.category]);
  }
  window2.SDK.init(normalized.products, config);
  const groups = classify(normalized.products, window2.SDK);
  const labels = new Map(groups.flatMap((group) => group.product_ids.map((id) => [id, group.label])));
  for (const item of normalized.products) item.category = labels.get(item.id) || item.category;
  const sourceById = new Map(normalized.products.map((item) => [item.id, item.source_category]));
  for (const group of groups) {
    group.source_categories = [...new Set(group.product_ids.map((id) => sourceById.get(id)))];
    group.categories = [group.label];
  }
  window2.SDK.init(normalized.products, config);
  const categories = window2.SDK.categories();
  const summary = { mode: "imported", fallback: false, product_count: window2.SDK.count(), source_category_count: sourceCategories.length, source_categories: sourceCounts, category_count: categories.length, categories: categories.map((name) => ({ name, count: window2.SDK.list().filter({ category: name }).count() })), main_categories: groups, needs_secondary_classification: groups.length < 5, image_cdn: normalized.base || null, needs_image_cdn: !normalized.base && normalized.products.some((item) => [item.main_image, ...item.images].some((path) => path && !/^(?:https?:)?\/\//i.test(path))), image_resolution: "render-time only: storeData.imageUrl(path)", source_sha256: fingerprint, missing_images: normalized.products.filter((item) => !item.main_image).length, config_defaults: config };
  const compact = () => ({ ...summary, source_categories: summary.source_categories.slice(offset2, offset2 + limit), category_page, categories: summary.categories.slice(0, 200), categories_truncated: summary.source_categories.length > 200, main_categories: groups.map((group) => ({ id: group.id, label: group.label, count: group.count, image: group.image, source_category_count: group.source_categories?.length || 0, sample_product_ids: group.product_ids.slice(0, 3), filter_source: "SDK.categories(group.label).result()" })) });
  if (input.action === "inspect") return { ...compact(), written: [] };
  const renderHelper = `window.productImageUrl = function (value) {
    if (value == null || value === '') return '';
    const path = String(value).trim();
    if (/^(?:https?:)?\\/\\//i.test(path)) {
      const url = new URL(path.startsWith('//') ? 'https:' + path : path);
      return url.username || url.password ? '' : url.href;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.includes('\\\\')) return '';
    const configured = (window.commerceConfig && window.commerceConfig.imageCdn) || ${JSON.stringify(normalized.base || "")};
    if (!configured) return '';
    const base = new URL(configured);
    if (!/^https?:$/.test(base.protocol) || base.username || base.password) return '';
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(path.replace(/^\\/+/, ''), base).href;
  };`;
  const files = [{ path: "js/data.js", content: await formatSource("js/data.js", `window.productData = ${JSON.stringify(normalized.products, (key, value) => ["__proto__", "constructor", "prototype"].includes(key) ? void 0 : value, 2)};
window.catalogGroups = ${JSON.stringify(groups, null, 2)};
${renderHelper}
window.storeData = { getAll:()=>window.SDK.list().result(), getById:id=>window.SDK.get(String(id)), getByCategory:category=>window.SDK.categories(category).result(), formatPrice:value=>window.SDK.price(value), imageUrl:value=>window.productImageUrl(value), toCartItem:product=>({id:product.id,name:product.name,image:product.main_image,price:product.final_price}) };
`) }];
  for (const name of ["sdk.js", "ec-sdk.js"]) {
    try {
      await stat4(join6(view.directory, "js", name));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      files.push({ path: `js/${name}`, content: await readFile9(join6(skillRoot, "assets/commerce", name), "utf8") });
    }
  }
  try {
    await stat4(join6(view.directory, "js/app.js"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    files.push({ path: "js/app.js", content: `window.commerceConfig = ${JSON.stringify(config)};
` });
  }
  files.push({ path: "website-builder.import.json", content: JSON.stringify({ ...summary, schema: "sdk-import-v2", runtime_data_sha256: createHash4("sha256").update(files[0].content).digest("hex"), source: input.file_path || "provided-json", field_map: input.field_map || {}, category_map: mapping || {} }, null, 2) });
  await store.write(input.thread_id, files);
  return { ...compact(), written: files.map((file) => file.path), note: "SDK.category/categories/filter\u8FD4\u56DE\u4E8C\u6B21\u5206\u7C7B\uFF0Csource_category\u4FDD\u7559\u539F\u7C7B\uFF1B\u56FE\u7247\u5B57\u6BB5\u4FDD\u7559\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u53EA\u6709\u6E32\u67D3\u65F6\u8C03\u7528storeData.imageUrl\u62FC\u63A5CDN\uFF1B\u4E0D\u8DB35\u7EC4\u65F6\u6309\u771F\u5B9E\u4E1A\u52A1\u8865\u5145\u5206\u7EC4\uFF0C\u4E0D\u80FD\u4F2A\u9020\u5206\u7C7B\u3002\u5DF2\u6709SDK/\u914D\u7F6E\u672A\u8986\u76D6\uFF0C\u5E01\u79CD\u914D\u7F6E\u7F3A\u5931\u9879\u6309config_defaults\u5408\u5E76\u3002" };
}

export {
  formatSource,
  readTemplates,
  ProjectStore,
  resourceChunk,
  createPreview,
  previewPayload,
  compactProject,
  projectService,
  prepareCommerce,
  screenshotPage,
  importProducts
};
