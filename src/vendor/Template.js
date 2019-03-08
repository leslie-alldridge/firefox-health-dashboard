import { coalesce, isObject, isString, missing } from './utils';
import { toPairs } from './vectors';
import { Log } from './errors';
import Data from './Data';
import strings from './strings';

let expandAny = null;

function expandArray(arr, namespaces) {
  // AN ARRAY OF TEMPLATES IS SIMPLY CONCATENATED
  return arr.map(t => expandAny(t, namespaces)).join('');
}

function expandLoop(loop, namespaces) {
  const { from, template, separator } = loop;

  if (!isString(from)) Log.error('expecting from clause to be string');

  return Data.get(namespaces[0], loop.from)
    .map(m => {
      const ns = Data.copy(namespaces[0]);

      if (isObject(m)) {
        toPairs(m).forEach((v, k) => {
          ns[k.toLowerCase()] = v;
        });
      }

      namespaces.forEach((n, i) => {
        ns[Array(i + 3).join('.')] = n;
      });

      const nns = namespaces.slice();

      nns.unshift(ns);

      return expandAny(template, nns);
    })
    .join(coalesce(separator, ''));
}

function run(method, val, rest) {
  // eslint-disable-next-line no-eval
  return eval(`method(val, ${rest}`);
}

function expandText(template, namespaces) {
  // namespaces IS AN ARRAY OBJECTS FOR VARIABLE NAME LOOKUP
  // CASE INSENSITIVE VARIABLE REPLACEMENT

  // COPY VALUES, BUT WITH lowerCase KEYS
  const ns = namespaces[0];
  const [aString, ...varStringPairs] = template.split('{{');
  const acc = [aString];

  return [
    acc,
    ...varStringPairs.map(vsp => {
      const [variable, suffixString] = vsp.split('}}', 2);
      const [accessor, ...postProcessing] = variable.split('|');
      let val = Data.get(ns, accessor.toLowerCase());

      postProcessing.forEach(step => {
        const [func, rest] = step.split('(', 2);

        if (strings[func] === undefined) {
          Log.error(
            `{{func}} is an unknown string function for template expansion`,
            { func }
          );
        }

        const method = strings[func];

        if (missing(rest)) {
          val = method(val);
        } else {
          try {
            val = run(method, val, rest);
          } catch (f) {
            Log.warning(`Can not evaluate {{variable|json}}`, { variable }, f);
          }
        }
      });

      if (val === undefined) {
        return `undefined${suffixString}`;
      }

      if (val == null) {
        // NULL IS NOTHING
        return suffixString;
      }

      if (isString(val)) {
        return val + suffixString;
      }

      if (val.toString) {
        return val.toString() + suffixString;
      }

      return `${val}${suffixString}`;
    }),
  ].join('');
}

expandAny = (template, namespaces) => {
  if (missing(template)) {
    return '';
  }

  if (Array.isArray(template)) {
    return expandArray(template, namespaces);
  }

  if (isString(template)) {
    return expandText(template, namespaces);
  }

  if (template.from) {
    return expandLoop(template, namespaces);
  }

  Log.error('Not recognized {{template|json}}', { template });
};

function expand(template, parameters) {
  if (parameters === undefined) {
    if (isString(template)) return template;
    Log.error('Must have parameters');
  }

  function lower(v) {
    if (v == null) {
      return v;
    }

    if (
      typeof v === 'object' &&
      !(v instanceof Array) &&
      !(v instanceof Date)
      // !(v instanceof Duration)
    ) {
      return toPairs(v)
        .map((v, k) => [lower(v), k.toLowerCase()])
        .args()
        .fromPairs();
    }

    return v;
  }

  const map = lower(parameters);

  return expandAny(template, [map]);
}

class Template {
  constructor(template) {
    this.template = template;
  }

  expand(values) {
    expand(this.template, values);
  }
}

export { Template, expand };
