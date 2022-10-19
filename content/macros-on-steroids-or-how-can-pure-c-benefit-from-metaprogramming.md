---
references:
  - id: bluepainting
    title: "C99 draft, section 6.10.3.4, paragraph 2 -- Rescanning and further replacement"
    author: C99 committee
    URL: "http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1256.pdf"

  - id: cloak-rec
    title: "Cloak Wiki on preprocessor recursion"
    author: Paul Fultz II
    URL: "https://github.com/pfultz2/Cloak/wiki/C-Preprocessor-tricks,-tips,-and-idioms#recursion"

  - id: so-rec-macros-1
    title: "Foreach macro on macros arguments"
    author: kokosing
    URL: "https://stackoverflow.com/questions/6707148/foreach-macro-on-macros-arguments"

  - id: so-rec-macros-2
    title: "Understanding DEFER and OBSTRUCT macros"
    author: Vittorio Romeo
    URL: "https://stackoverflow.com/questions/29962560/understanding-defer-and-obstruct-macros"

  - id: metalang99-iterative-debug
    title: "Q: What about compile-time errors?"
    author: hirrolot
    URL: "https://github.com/hirrolot/metalang99#q-what-about-compile-time-errors"
---

<div class="introduction">

<p class="discussions">[HN](https://news.ycombinator.com/item?id=27919448) · [r/programming](https://www.reddit.com/r/programming/comments/opefdc/macros_on_steroids_or_how_can_pure_c_benefit_from/) · [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/comments/opeez9/macros_on_steroids_or_how_can_pure_c_benefit_from/) · [r/C_Programming](https://www.reddit.com/r/C_Programming/comments/opeeo0/macros_on_steroids_or_how_can_pure_c_benefit_from/)</p>

_This post has a [followup](../posts/whats-the-point-of-the-c-preprocessor-actually.html)._

Have you ever envisioned the daily C preprocessor as a tool for some decent metaprogramming?

Have you ever envisioned the C preprocessor as a tool that can improve the correctness, clarity, and overall maintainability of your code, when used sanely?

I did. And I have done everything dependent on me to make it real.

Meet [Metalang99], a simple functional language that allows you to create complex metaprograms. It represents a header-only macro library, so everything you need to set it up is `-Imetalang99/include` and a C99 compiler [^c-or-cpp]. However, today I shall focus only on two accompanying libraries -- [Datatype99] and [Interface99]. Being implemented atop of Metalang99, they unleash the potential of preprocessor metaprogramming at the full scale, and therefore are more useful for an average C programmer.

I shall also address a few captious questions regarding compilation times, compilation errors, and applicability of my method to the real world.

[Metalang99]: https://github.com/hirrolot/metalang99
[Datatype99]: https://github.com/hirrolot/datatype99
[Interface99]: https://github.com/hirrolot/interface99

Nuff said, let us dive into it!

</div>

## The three kinds of code repetition

There is an important thing called _code repetition_. There are three kinds of it [^three-repetition]:

 1. The repetition that can be avoided by using functions,
 2. by using trivial macros,
 3. by using macros with loops/recursion.

Whenever you encounter repetition in your code, you try to eliminate it first by using functions, then by using macros. For example, instead of copy-pasting the same code of reading user data each time, we can reify it into the function `read_user`:

```{.c .numberLines}
void read_user(char *user) {
    printf("Type user: ");
    const bool user_read = scanf("%15s", user) == 1;
    assert(user_read);

    printf("New user %s\n", user);
}

char amy[16], luke[16];

read_user(amy);
read_user(luke);
```

Sometimes you cannot avoid repetition through functions. Then you resort to macros:

```{.c .numberLines}
#define list_for_each(pos, head) \
    for (pos = (head)->next; pos != (head); pos = pos->next)

struct list_head *current;
list_for_each(current, &self->items) {
    // Do something meaningful...
}
```

<p class="adapted-from">Adapted from [`linux/include/linux/list.h`](https://github.com/torvalds/linux/blob/master/include/linux/list.h).</p>

Going further, sometimes you cannot eliminate repetition through trivial macros (macros that cannot loop/recurse). Speaking technically, all macros in C are trivial since the preprocessor blocks macro recursion automatically [@bluepainting; @cloak-rec; @so-rec-macros-1; @so-rec-macros-2]:

<p class="code-annotation">`rec.c`</p>

```{.c .numberLines}
#define FOO(x, ...) x; FOO(__VA_ARGS__)

FOO(1, 2, 3)
```

<p class="code-annotation">`/bin/sh` [^e-p-flags]</p>
```{.code .numberLines}
$ clang rec.c -E -P -Weverything -std=c99
rec.c:3:1: warning: disabled expansion of recursive macro [-Wdisabled-macro-expansion]
FOO(1, 2, 3)
^
rec.c:1:24: note: expanded from macro 'FOO'
#define FOO(x, ...) x; FOO(__VA_ARGS__)
                       ^

1; FOO(2, 3)
1 warning generated.
```

What you are going to do with the following code snippet then?

```{.c .numberLines}
typedef struct {
    struct BinaryTree *lhs;
    int x;
    struct BinaryTree *rhs;
} BinaryTreeNode;

typedef struct {
    enum { Leaf, Node } tag;
    union {
        int leaf;
        BinaryTreeNode node;
    } data;
} BinaryTree;
```

Experienced C programmers might have noticed that the pattern is called a [tagged union]. It is described as follows:

[tagged union]: https://en.wikipedia.org/wiki/Tagged_union

```{.code .numberLines}
typedef struct {
    enum { <tag>... } tag;
    union { <type> <tag>... } data;
} <name>;
```

See `<tag>...` and `<type> <tag>...`? These are the little monsters of code repetition. They cannot be generated even by a naive variadic macro [^variadic-macro], since the tags (variant names) and the corresponding types are interleaved with each other. We may want to build some syntax sugar atop of bare tagged unions, but the thing is that _we cannot_. For example, this is how the same `BinaryTree` might look in Rust:

[variadic macro]: https://en.cppreference.com/w/c/preprocessor/replace

```{.rust .numberLines}
enum BinaryTree {
    Leaf(i32),
    Node(Box<BinaryTree>, i32, Box<BinaryTree>),
}
```

Another example: interfaces. Consider the `Airplane` interface:

```{.c .numberLines}
typedef struct {
    void (*move_forward)(void *self, int distance);
    void (*move_back)(void *self, int distance);
    void (*move_up)(void *self, int distance);
    void (*move_down)(void *self, int distance);
} AirplaneVTable;

// The definitions of `MyAirplane_*` methods here...

const AirplaneVTable my_airplane = {
    MyAirplane_move_forward,
    MyAirplane_move_back,
    MyAirplane_move_up,
    MyAirplane_move_down,
};
```

Can you notice the repetition here? Right, in the definition of `AirplaneVTable my_airplane`. We already know the names of the interface methods, why do we need to specify them again? Why could not we just write `impl(Airplane, MyAirplane)` which will collect all methods' names and prepend `MyAirplane` to each one? In Rust:

```{.rust .numberLines}
trait Airplane {
    fn move_forward(&mut self, distance: i32);
    fn move_back(&mut self, distance: i32);
    fn move_up(&mut self, distance: i32);
    fn move_down(&mut self, distance: i32);
}

impl Airplane for MyAirplane {
    // The definitions of `MyAirplane` methods here...
}
```

I think you already know the answer: because preprocessor macros cannot loop/recurse and, therefore, cannot iterate on unbounded sequences of arguments.

This is what Metalang99 is for.

Metalang99 is a _natural_ extension to the preprocessor; it allows you to eliminate the third kind of code repetition -- by using macro iteration. This possibility has given rise to the complete support for [algebraic data types] and software interfaces, both of which we shall discuss in the next two sections. Reader, follow me!

[algebraic data types]: https://en.wikipedia.org/wiki/Algebraic_data_type

## Algebraic data types

Recall to the aforementioned `BinaryTree` tagged union. With the aid of [Datatype99], a library implemented atop of Metalang99, it can be defined as follows:

```{.c .numberLines}
#include <datatype99.h>

datatype(
    BinaryTree,
    (Leaf, int),
    (Node, BinaryTree *, int, BinaryTree *)
);
```

And manipulated as follows [^pattern-matching]:

```{.c .numberLines}
int sum(const BinaryTree *tree) {
    match(*tree) {
        of(Leaf, x) return *x;
        of(Node, lhs, x, rhs) return sum(*lhs) + *x + sum(*rhs);
    }

    return -1;
}
```

The neat part is that not only such use of macros reduces boilerplate but also reduces the risk of a failure: you can no longer access `.rhs` if the binary tree is just `Leaf` (since the variable `rhs` merely has not been introduced to the scope after `of(Leaf, x)`), or construct `BinaryTree` with `.tag = Leaf` and data for `Node`.

If you want to observe the generated code, please follow [godbolt](https://godbolt.org/z/3TKn8T3Gj).

## Software interfaces

The same holds for the aforementioned `AirplaneVTable`. Here is how easy you can define it with [Interface99]:

```{.c .numberLines}
#define Airplane_IFACE                             \
    vfunc(void, move_forward, VSelf, int distance) \
    vfunc(void, move_back, VSelf, int distance)    \
    vfunc(void, move_up, VSelf, int distance)      \
    vfunc(void, move_down, VSelf, int distance)

interface(Airplane);

// The definitions of `MyAirplane_*` methods here...

impl(Airplane, MyAirplane);
```

`impl(Airplane, MyAirplane)` is the most noticeable part here; it deduces the methods' names from the context, freeing you from the burden of updating the definition each time you add/remove/rename an interface method.

At the end of the game, you will end up with this:

```{.c .numberLines}
// interface(Airplane);
typedef struct AirplaneVTable AirplaneVTable;
typedef struct Airplane Airplane;

struct AirplaneVTable {
    void (*move_forward)(VSelf, int distance);
    void (*move_back)(VSelf, int distance);
    void (*move_up)(VSelf, int distance);
    void (*move_down)(VSelf, int distance);
};

struct Airplane {
    void *self;
    const AirplaneVTable *vptr;
};

// impl(Airplane, MyAirplane);
static const AirplaneVTable MyAirplane_Airplane_impl = {
    .move_forward = MyAirplane_move_forward,
    .move_back = MyAirplane_move_back,
    .move_up = MyAirplane_move_up,
    .move_down = MyAirplane_move_down,
};

```

Pretty much the same as if you wrote by hand. [Virtual method tables] are so common that they are used almost in every medium/large-sized project in C:

[Virtual method tables]: https://en.wikipedia.org/wiki/Virtual_method_table

 - **The Linux kernel.** It turns out that they use [their own, informally specified](https://lwn.net/Articles/444910/) method dispatch technique, which is pretty similar to virtual tables.

 - **FFmpeg.** In order to define a media codec, they [leverage](https://github.com/FFmpeg/FFmpeg/blob/7af1a3cebef6d9654675252f57689d46ac17d1e9/libavcodec/libopusenc.c#L583) the [`AVCodec`] structure with some callback functions within.

 - **VLC.** Likewise,  they [leverage](https://github.com/videolan/vlc/blob/923b582e8f10de38f285be54e92672ca8c1c1c0a/modules/codec/opus.c#L185) the [`decoder_t`] structure for a media decoder.

[`AVCodec`]: https://github.com/FFmpeg/FFmpeg/blob/7af1a3cebef6d9654675252f57689d46ac17d1e9/libavcodec/codec.h#L197
[`decoder_t`]: https://github.com/videolan/vlc/blob/923b582e8f10de38f285be54e92672ca8c1c1c0a/include/vlc_codec.h#L100

Both Interface99 and Datatype99 reify informal software development patterns into utterly formal programmatic abstractions. Each time you write a separate function to perform a certain task several times, you conceptually do the same.

Both Interface99 and Datatype99 rely on heavy use of macros, which would not be possible without something like Metalang99.

## What about the compilation errors?

This all is good and fun, but what about the compilation errors? How do they look? Are they comprehensible at all?

I know how insane error messages can be with metaprogramming [^hello-boost-pp], and how frustrating it can be to figure out what do they mean. While it is technically impossible to handle all kinds of syntax mismatches, I have put a huge effort to make most of the diagnostics comprehensible. Let us imagine that you have accidentally made a syntax mistake in a macro invocation. Then you will see something like this:

<p class="code-annotation">`playground.c`</p>

```{.c .numberLines}
datatype(A, (Foo, int), Bar(int));
```

<p class="code-annotation">`/bin/sh`</p>

```{.code .numberLines}
$ gcc playground.c -Imetalang99/include -Idatatype99 -ftrack-macro-expansion=0
playground.c:3:1: error: static assertion failed: "ML99_assertIsTuple: Bar(int) must be (x1, ..., xN)"
    3 | datatype(A, (Foo, int), Bar(int));
      | ^~~~~~~~
```

Or this:

<p class="code-annotation">`playground.c`</p>

```{.c .numberLines}
datatype(A, (Foo, int) (Bar, int));
```

<p class="code-annotation">`/bin/sh`</p>

```{.code .numberLines}
$ gcc playground.c -Imetalang99/include -Idatatype99 -ftrack-macro-expansion=0
playground.c:3:1: error: static assertion failed: "ML99_assertIsTuple: (Foo, int) (Bar, int) must be (x1, ..., xN), did you miss a comma?"
    3 | datatype(A, (Foo, int) (Bar, int));
      | ^~~~~~~~
```

If an error is not really in the syntax part, you will see something like this:

<p class="code-annotation">`playground.c`</p>

```{.c .numberLines}
datatype(Foo, (FooA, NonExistingType));
```

<p class="code-annotation">`/bin/sh`</p>

```{.code .numberLines}
playground.c:3:1: error: unknown type name ‘NonExistingType’
    3 | datatype(
      | ^~~~~~~~
playground.c:3:1: error: unknown type name ‘NonExistingType’
playground.c:3:1: error: unknown type name ‘NonExistingType’
```

Or this:

<p class="code-annotation">`playground.c`</p>

```{.c .numberLines}
match(*tree) {
    of(Leaf, x) return *x;
    // of(Node, lhs, x, rhs) return sum(*lhs) + *x + sum(*rhs);
}
```

<p class="code-annotation">`/bin/sh`</p>

```{.code .numberLines}
playground.c: In function ‘sum’:
playground.c:6:5: warning: enumeration value ‘NodeTag’ not handled in switch [-Wswitch]
    6 |     match(*tree) {
      |     ^~~~~
```

Take a look at this example with Interface99:

<p class="code-annotation">`playground.c`</p>

```{.c .numberLines}
#define Foo_IFACE vfunc(void, foo, int x, int y)
interface(Foo);

typedef struct {
    char dummy;
} MyFoo;

// Missing `void MyFoo_foo(int x, int y)`.

impl(Foo, MyFoo);
```

<p class="code-annotation">`/bin/sh`</p>

```{.code .numberLines}
playground.c:12:1: error: ‘MyFoo_foo’ undeclared here (not in a function)
   12 | impl(Foo, MyFoo);
      | ^~~~

```

When a macro failed, and I do not get what is wrong just by looking at the console or by looking at its invocation (which is very rare), I observe the expansion with `-E`. This is where the formal specifications of Datatype99 and Interface99 come into play: even in the expanded code, I will not see something unexpected since the code generation semantics are fixed and laid out in their corresponding `README.md`s.

## The compilation times?

The compilation times are not really an issue. Let us see how much it takes to compile [`datatype99/examples/binary_tree.c`]:

[`datatype99/examples/binary_tree.c`]: https://github.com/hirrolot/datatype99/blob/master/examples/binary_tree.c

<p class="code-annotation">`/bin/sh` [^ftrack-macro-expansion]</p>

```{.code .numberLines}
$ time gcc examples/binary_tree.c -Imetalang99/include -I. -ftrack-macro-expansion=0

real    0m0,121s
user    0m0,107s
sys     0m0,011s
```

This might be an issue only if you have a lot of macro stuff in header files. If so, I suggest to use a widely known technique called [precompiled headers] so that they will be transformed into some compiler's intermediate representation and then put into a cache instead of being unnecessarily re-compiled on each file inclusion.

[precompiled headers]: https://en.wikipedia.org/wiki/Precompiled_header

## Final words

As it usually goes in software engineering, macros are a trade-off: _will you continue writing boilerplate code, thereby slowing down the development process and increasing the risk of bugs, or will you start using powerful macros at the cost of the [great implementation complexity] [^leaky-abstractions] and slightly less comprehensible errors?_

[great implementation complexity]: https://github.com/hirrolot/metalang99#q-how-does-it-work

If you stick to the first choice, are you sure that it would be easier to figure out what is wrong with the code at runtime rather than at compile-time, especially when unreified abstractions got intertwined with your business logic? Are you okay with the fact that more bugs will end up being hidden in deployed production code instead of being intelligently found by a compiler (as in static vs. dynamic typing)?

If you stick to the second choice, are you sure your team will let you integrate all this metaprogramming machinery into your codebase, even if used indirectly? I have seen several groups of developers that had to review all third-party code they use [^trusted-libs] -- not every programmer can/want to review Metalang99. Not to be misunderstood, I have made Metalang99, Datatype99, and Interface99 in the most simple and clean way I could, but the very nature of the preprocessor really makes itself felt [^metalang99-plt].

The choice is up to you.

Links:

 - Installation instructions for [Metalang99](https://github.com/hirrolot/metalang99#getting-started), [Datatype99](https://github.com/hirrolot/datatype99#installation), [Interface99](https://github.com/hirrolot/interface99#installation).
 - [Q: Why use C instead of Rust/Zig/whatever else?](https://github.com/hirrolot/datatype99#q-why-use-c-instead-of-rustzigwhatever-else)
 - [Q: Why not third-party code generators?](https://github.com/hirrolot/metalang99#q-why-not-third-party-code-generators)
 - The [mailing list] for the above libraries. Join and talk with us!

[mailing list]: https://lists.sr.ht/~hirrolot/metalang99

## References

[^c-or-cpp]: Speaking formally, both the C and C++ preprocessors can execute Metalang99 (they are identical except for C++20's [`__VA_OPT__`]). Speaking pragmatically, only pure C can significantly benefit from it.

[`__VA_OPT__`]: https://en.cppreference.com/w/cpp/preprocessor/replace

[^three-repetition]: Just for the purposes of this blog post! In reality, there might be many more than three. 

[^e-p-flags]: `-E` stands for "preprocess only", `-P` stands for "do not print included headers".

[^variadic-macro]: A [variadic macro] is a macro that can accept an unbounded sequence of arguments.

[^pattern-matching]: This is called [pattern matching], a technique to destructure a sum type (tagged union) into its respective components.

[pattern matching]: https://en.wikipedia.org/wiki/Pattern_matching

[^hello-boost-pp]: Hello, [Boost/Preprocessor]!

[Boost/Preprocessor]: http://boost.org/libs/preprocessor

[^ftrack-macro-expansion]: The GCC option `-ftrack-macro-expansion=0` means not to print a useless bedsheet of macro expansions. Also, it drastically speeds up compilation, so I recommend you to always use it with Metalang99. If you use Clang, you can specify `-fmacro-backtrace-limit=1` to achieve approximately the same effect.

[^leaky-abstractions]: Do you remember about [the law of leaky abstractions], my friend? 😁

[the law of leaky abstractions]: https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/

[^trusted-libs]: Except for so-called "trusted" libraries such as OpenSSL or glibc.

[^metalang99-plt]: A reviewer of Metalang99 should also has some basic familiarity with [programming language theory]; at least, a reviewer should understand such terms as an [EBNF grammar], [operational semantics], [lambda calculus], and so on, in order to read the [specification](https://github.com/hirrolot/metalang99/blob/master/spec/spec.pdf).

[programming language theory]: https://en.wikipedia.org/wiki/Programming_language_theory
[EBNF grammar]: https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
[operational semantics]: https://en.wikipedia.org/wiki/Operational_semantics
[lambda calculus]: https://en.wikipedia.org/wiki/Lambda_calculus
