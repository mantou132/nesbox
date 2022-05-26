import { updateStore } from '@mantou/gem';

import {
  AcceptFriend,
  AcceptFriendMutation,
  AcceptFriendMutationVariables,
  AcceptInvite,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
  ApplyFriend,
  ApplyFriendMutation,
  ApplyFriendMutationVariables,
  CreateComment,
  CreateCommentMutation,
  CreateCommentMutationVariables,
  CreateInvite,
  CreateInviteMutation,
  CreateInviteMutationVariables,
  CreateMessage,
  CreateMessageMutation,
  CreateMessageMutationVariables,
  CreateRoom,
  CreateRoomMutation,
  CreateRoomMutationVariables,
  EnterPubRoom,
  EnterPubRoomMutation,
  EnterPubRoomMutationVariables,
  Event,
  EventSubscription,
  FavoriteGame,
  FavoriteGameMutation,
  FavoriteGameMutationVariables,
  GetAccount,
  GetAccountQuery,
  GetAccountQueryVariables,
  GetCommentsQuery,
  GetCommentsQueryVariables,
  GetFriends,
  GetFriendsQuery,
  GetFriendsQueryVariables,
  GetGames,
  GetGamesQuery,
  GetGamesQueryVariables,
  GetMessages,
  GetMessagesQuery,
  GetMessagesQueryVariables,
  GetRooms,
  GetRoomsQuery,
  GetRoomsQueryVariables,
  LeaveRoom,
  LeaveRoomMutation,
  LeaveRoomMutationVariables,
  ScFriendStatus,
  ScNewComment,
  ScNewRoom,
  ScUpdateRoom,
  SendSignal,
  SendSignalMutation,
  SendSignalMutationVariables,
  UpdateAccount,
  UpdateAccountMutation,
  UpdateAccountMutationVariables,
  UpdateRoom,
  UpdateRoomMutation,
  UpdateRoomMutationVariables,
} from 'src/generated/graphql';
import { store } from 'src/store';
import { request, subscribe } from 'src/services';
import { configure } from 'src/configure';
import { events, Singal, SingalEvent } from 'src/constants';

export const getGames = async () => {
  const { games, topGames, favorites } = await request<GetGamesQuery, GetGamesQueryVariables>(GetGames, {});
  const gameIds = games.map((e) => {
    store.games[e.id] = e;
    return e.id;
  });
  updateStore(store, {
    gameIds,
    favoriteIds: favorites,
    topGameIds: [...topGames, ...gameIds].splice(0, 5),
  });
};

export const getRooms = async () => {
  const { rooms } = await request<GetRoomsQuery, GetRoomsQueryVariables>(GetRooms, {});
  updateStore(store, {
    roomIds: rooms.map((e) => {
      store.rooms[e.id] = e;
      return e.id;
    }),
  });
};

export const createRoom = async (input: ScNewRoom) => {
  const { createRoom } = await request<CreateRoomMutation, CreateRoomMutationVariables>(CreateRoom, { input });
  configure.user!.playing = createRoom;
  updateStore(configure);
};

export const updateRoom = async (input: ScUpdateRoom) => {
  const { updateRoom } = await request<UpdateRoomMutation, UpdateRoomMutationVariables>(UpdateRoom, { input });
  configure.user!.playing = updateRoom;
  updateStore(configure);
};

export const enterPubRoom = async (roomId: number) => {
  const { enterPubRoom } = await request<EnterPubRoomMutation, EnterPubRoomMutationVariables>(EnterPubRoom, {
    input: { roomId },
  });
  configure.user!.playing = enterPubRoom;
  updateStore(configure);
};

export const leaveRoom = async () => {
  await request<LeaveRoomMutation, LeaveRoomMutationVariables>(LeaveRoom, {});
  delete configure.user!.playing;
  updateStore(configure);
};

export const getAccount = async () => {
  const { account } = await request<GetAccountQuery, GetAccountQueryVariables>(GetAccount, {});
  updateStore(configure, {
    user: account,
  });
};

export const updateAccount = async ({ nickname, settings }: { nickname: string; settings: string }) => {
  const { updateAccount } = await request<UpdateAccountMutation, UpdateAccountMutationVariables>(UpdateAccount, {
    input: { nickname, settings },
  });
  updateStore(configure, {
    user: updateAccount,
  });
};

export const getFriends = async () => {
  const { friends, invites } = await request<GetFriendsQuery, GetFriendsQueryVariables>(GetFriends, {});
  updateStore(store, {
    friendIds: friends.map((e) => {
      store.friends[e.user.id] = e;
      return e.user.id;
    }),
    inviteIds: invites.map((e) => {
      store.invites[e.id] = e;
      return e.id;
    }),
  });
};

export const applyFriend = async (targetId: number) => {
  await request<ApplyFriendMutation, ApplyFriendMutationVariables>(ApplyFriend, { input: { targetId } });
};

export const acceptFriend = async (targetId: number, accept: boolean) => {
  await request<AcceptFriendMutation, AcceptFriendMutationVariables>(AcceptFriend, { input: { targetId, accept } });
  if (accept) {
    store.friends[targetId]!.status = ScFriendStatus.Accept;
  } else {
    store.friendIds = store.friendIds?.filter((id) => id !== targetId);
  }
  updateStore(store);
};

export const createInvite = async (targetId: number, roomId: number) => {
  await request<CreateInviteMutation, CreateInviteMutationVariables>(CreateInvite, { input: { targetId, roomId } });
};

export const acceptInvite = async (inviteId: number, accept: boolean) => {
  await request<AcceptInviteMutation, AcceptInviteMutationVariables>(AcceptInvite, { input: { inviteId, accept } });
  if (accept) {
    configure.user!.playing = store.invites[inviteId]?.room;
    updateStore(configure);
  } else {
    store.inviteIds = store.inviteIds?.filter((id) => id !== inviteId);
    delete store.invites[inviteId];
    updateStore(store);
  }
};

export const getComments = async (gameId: number) => {
  const { comments } = await request<GetCommentsQuery, GetCommentsQueryVariables>(GetRooms, { input: { gameId } });
  store.comment[gameId] = {
    userIds: comments.map((e) => e.user.id),
    comments: Object.fromEntries(comments.map((e) => [e.user.id, e])),
  };
  updateStore(store);
};

export const createComment = async (input: ScNewComment) => {
  const { createComment } = await request<CreateCommentMutation, CreateCommentMutationVariables>(CreateComment, {
    input,
  });
  store.comment[input.gameId].userIds = [
    ...store.comment[input.gameId].userIds!.filter((id) => configure.user!.id !== id),
    configure.user!.id,
  ];
  store.comment[input.gameId].comments[configure.user!.id] = createComment;
  updateStore(store);
};

export const getMessages = async (targetId: number) => {
  const { messages } = await request<GetMessagesQuery, GetMessagesQueryVariables>(GetMessages, { input: { targetId } });
  store.messageIds[targetId] = messages.map((e) => {
    store.messages[targetId] = e;
    return e.id;
  });
  updateStore(store);
};

export const createMessage = async (targetId: number, body: string) => {
  const { createMessage } = await request<CreateMessageMutation, CreateMessageMutationVariables>(CreateMessage, {
    input: { targetId, body },
  });
  store.messageIds[targetId]?.push(createMessage.id);
  store.messages[createMessage.id] = createMessage;
  updateStore(store);
};

export const favoriteGame = async (gameId: number, favorite: boolean) => {
  await request<FavoriteGameMutation, FavoriteGameMutationVariables>(FavoriteGame, {
    input: {
      gameId,
      favorite,
    },
  });
  if (favorite) {
    store.favoriteIds?.push(gameId);
  } else {
    store.favoriteIds = store.favoriteIds?.filter((id) => id !== gameId);
  }
  updateStore(store);
};

export const sendSignal = async (targetId: number, singal: Singal) => {
  await request<SendSignalMutation, SendSignalMutationVariables>(SendSignal, {
    input: { targetId, json: JSON.stringify(singal) },
  });
};

export const subscribeEvent = () => {
  const subscription = subscribe<EventSubscription>(Event);
  (async function () {
    for await (const { event } of subscription) {
      const {
        newMessage,
        newGame,
        deleteGame,
        updateRoom,
        deleteRoom,
        newInvite,
        deleteInvite,
        applyFriend,
        acceptFriend,
        deleteFriend,
        updateUser,
        sendSignal,
      } = event;

      if (newMessage) {
        store.messages[newMessage.id] = newMessage;
        const userId = newMessage.userId === configure.user?.id ? newMessage.targetId : newMessage.userId;
        (store.messageIds[userId] ||= []).push(newMessage.id);
        updateStore(store);
      }

      if (newGame) {
        store.games[newGame.id] = newGame;
        (store.gameIds ||= []).push(newGame.id);
        updateStore(store);
      }

      if (deleteGame) {
        delete store.games[deleteGame];
        updateStore(store, { gameIds: store.gameIds?.filter((id) => id !== deleteGame) });
      }

      if (updateRoom) {
        Object.assign(store.rooms[updateRoom.id], updateRoom);
        updateStore(store);
      }

      if (deleteRoom) {
        delete store.rooms[deleteRoom];
        updateStore(store, { roomIds: store.roomIds?.filter((id) => id !== deleteRoom) });
        if (configure.user && configure.user.playing?.id === deleteGame) {
          delete configure.user.playing;
          updateStore(configure);
        }
      }

      if (newInvite) {
        store.invites[newInvite.id] = newInvite;
        (store.inviteIds ||= []).push(newInvite.id);
        updateStore(store);
      }

      if (deleteInvite) {
        delete store.invites[deleteInvite];
        updateStore(store, { inviteIds: store.inviteIds?.filter((id) => id !== deleteInvite) });
      }

      if (applyFriend) {
        store.friends[applyFriend.user.id] = applyFriend;
        (store.friendIds ||= []).push(applyFriend.user.id);
        updateStore(store);
      }

      if (acceptFriend) {
        Object.assign(store.friends[acceptFriend.user.id], acceptFriend);
        updateStore(store);
      }

      if (deleteFriend) {
        delete store.friends[deleteFriend];
        updateStore(store, { friendIds: store.friendIds?.filter((id) => id !== deleteFriend) });
      }

      if (updateUser) {
        const friend = store.friends[updateUser.id];
        if (friend) {
          friend.user = updateUser;
          updateStore(store);
        }
      }

      if (sendSignal) {
        window.dispatchEvent(
          new CustomEvent<SingalEvent>(events.SINGAL, {
            detail: { userId: sendSignal.userId, singal: JSON.parse(sendSignal.json) },
          }),
        );
      }
    }
  })();
  return subscription;
};
